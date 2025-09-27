import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { Reply, Prisma } from '@prisma/client';

@Injectable()
export class RepliesService {
  private readonly logger = new Logger(RepliesService.name);

  constructor(private prisma: PrismaService) {}

  async createReply(createReplyDto: CreateReplyDto, createdById: string): Promise<Reply> {
    try {
      this.logger.log(`Creating reply for case note ${createReplyDto.caseNoteId} by user ${createdById}`);
      this.logger.log(`Reply data: ${JSON.stringify(createReplyDto)}`);
      
      // Verify the case note exists
      const caseNote = await this.prisma.caseNote.findUnique({
        where: { id: createReplyDto.caseNoteId },
        include: { createdBy: true }
      });

      if (!caseNote) {
        this.logger.error(`Case note not found: ${createReplyDto.caseNoteId}`);
        throw new NotFoundException('Case note not found');
      }

      this.logger.log(`Case note found: ${caseNote.id}`);

      // Create the reply
      const reply = await this.prisma.reply.create({
        data: {
          content: createReplyDto.content,
          priority: createReplyDto.priority || 'MEDIUM',
          caseNoteId: createReplyDto.caseNoteId,
          parentReplyId: createReplyDto.parentReplyId || null,
          caseType: createReplyDto.caseType,
          caseId: createReplyDto.caseId,
          patientId: createReplyDto.patientId,
          patientName: createReplyDto.patientName,
          metadata: createReplyDto.metadata || null,
          createdById,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          },
          caseNote: {
            select: {
              id: true,
              content: true,
              priority: true,
            }
          },
          parentReply: {
            select: {
              id: true,
              content: true,
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          childReplies: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      this.logger.log(`Created reply ${reply.id} for case note ${createReplyDto.caseNoteId} by user ${createdById}`);
      return reply;
    } catch (error) {
      this.logger.error(`Failed to create reply: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findAllReplies(caseNoteId: string): Promise<Reply[]> {
    try {
      const replies = await this.prisma.reply.findMany({
        where: {
          caseNoteId,
          deletedAt: null, // Only non-deleted replies
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          },
          parentReply: {
            select: {
              id: true,
              content: true,
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          childReplies: {
            where: { deletedAt: null },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                }
              },
              childReplies: {
                where: { deletedAt: null },
                include: {
                  createdBy: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      role: true,
                    }
                  },
                  childReplies: {
                    where: { deletedAt: null },
                    include: {
                      createdBy: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          email: true,
                          role: true,
                        }
                      }
                    },
                    orderBy: { createdAt: 'asc' }
                  }
                },
                orderBy: { createdAt: 'asc' }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Filter to only top-level replies (no parent)
      const topLevelReplies = replies.filter(reply => !reply.parentReplyId);
      
      this.logger.log(`Found ${topLevelReplies.length} top-level replies for case note ${caseNoteId}`);
      return topLevelReplies;
    } catch (error) {
      this.logger.error(`Failed to find replies: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Reply> {
    try {
      const reply = await this.prisma.reply.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          },
          caseNote: {
            select: {
              id: true,
              content: true,
              priority: true,
            }
          },
          parentReply: {
            select: {
              id: true,
              content: true,
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          childReplies: {
            where: { deletedAt: null },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!reply || reply.deletedAt) {
        throw new NotFoundException('Reply not found');
      }

      return reply;
    } catch (error) {
      this.logger.error(`Failed to find reply ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async updateReply(id: string, updateReplyDto: UpdateReplyDto, userId: string): Promise<Reply> {
    try {
      // Check if reply exists and user has permission
      const existingReply = await this.prisma.reply.findUnique({
        where: { id },
        include: { createdBy: true }
      });

      if (!existingReply || existingReply.deletedAt) {
        throw new NotFoundException('Reply not found');
      }

      if (existingReply.createdById !== userId) {
        throw new ForbiddenException('You can only edit your own replies');
      }

      const reply = await this.prisma.reply.update({
        where: { id },
        data: {
          ...updateReplyDto,
          isEdited: true,
          editedAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          },
          caseNote: {
            select: {
              id: true,
              content: true,
              priority: true,
            }
          },
          parentReply: {
            select: {
              id: true,
              content: true,
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          childReplies: {
            where: { deletedAt: null },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      this.logger.log(`Updated reply ${id} by user ${userId}`);
      return reply;
    } catch (error) {
      this.logger.error(`Failed to update reply ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async removeReply(id: string, userId: string): Promise<{ success: boolean }> {
    try {
      // Check if reply exists and user has permission
      const existingReply = await this.prisma.reply.findUnique({
        where: { id },
        include: { createdBy: true }
      });

      if (!existingReply || existingReply.deletedAt) {
        throw new NotFoundException('Reply not found');
      }

      if (existingReply.createdById !== userId) {
        throw new ForbiddenException('You can only delete your own replies');
      }

      // Soft delete the reply
      await this.prisma.reply.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        }
      });

      this.logger.log(`Soft deleted reply ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete reply ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getRepliesByCaseNote(caseNoteId: string): Promise<Reply[]> {
    return this.findAllReplies(caseNoteId);
  }

  async getRepliesByCase(caseType: string, caseId: string): Promise<Reply[]> {
    try {
      const replies = await this.prisma.reply.findMany({
        where: {
          caseType: caseType as any,
          caseId,
          deletedAt: null,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          },
          caseNote: {
            select: {
              id: true,
              content: true,
              priority: true,
            }
          },
          parentReply: {
            select: {
              id: true,
              content: true,
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          childReplies: {
            where: { deletedAt: null },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      this.logger.log(`Found ${replies.length} replies for case ${caseType}/${caseId}`);
      return replies;
    } catch (error) {
      this.logger.error(`Failed to find replies for case: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
