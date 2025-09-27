import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { RepliesService } from './replies.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('replies')
@UseGuards(JwtAuthGuard)
export class RepliesController {
  constructor(private readonly repliesService: RepliesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createReplyDto: CreateReplyDto, @Request() req: ExpressRequest & { user: any }) {
    const userId = req.user.id;
    return this.repliesService.createReply(createReplyDto, userId);
  }

  @Get('case-note/:caseNoteId')
  async findByCaseNote(@Param('caseNoteId') caseNoteId: string) {
    return this.repliesService.getRepliesByCaseNote(caseNoteId);
  }

  @Get('case/:caseType/:caseId')
  async findByCase(
    @Param('caseType') caseType: string,
    @Param('caseId') caseId: string
  ) {
    return this.repliesService.getRepliesByCase(caseType, caseId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.repliesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReplyDto: UpdateReplyDto,
    @Request() req: ExpressRequest & { user: any }
  ) {
    const userId = req.user.id;
    return this.repliesService.updateReply(id, updateReplyDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: any }) {
    const userId = req.user.id;
    await this.repliesService.removeReply(id, userId);
  }
}
