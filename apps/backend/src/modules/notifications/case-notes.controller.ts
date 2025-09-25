import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CaseNotesService } from './case-notes.service';
import { CreateCaseNoteDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CaseType } from '@prisma/client';

@Controller('case-notes')
export class CaseNotesController {
  constructor(private readonly caseNotesService: CaseNotesService) {}

  /**
   * Test endpoint for debugging case note creation
   */
  @Post('test')
  @Public()
  async testCreateCaseNote(
    @Body() createCaseNoteDto: CreateCaseNoteDto,
  ) {
    try {
      console.log('=== TEST CASE NOTE CREATION ===');
      console.log('Received DTO:', JSON.stringify(createCaseNoteDto, null, 2));
      
      // Use a test user ID
      const testUserId = '4c932dce-0ed9-4ad7-88a9-77424803f682';
      console.log('Using test user ID:', testUserId);
      
      const result = await this.caseNotesService.createCaseNote(createCaseNoteDto, testUserId);
      console.log('Test case note created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('=== TEST CASE NOTE CREATION ERROR ===');
      console.error('Error creating case note:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Create a new case note
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createCaseNote(
    @Body() createCaseNoteDto: CreateCaseNoteDto,
    @Request() req: any,
  ) {
    try {
      console.log('=== CASE NOTE CREATION DEBUG ===');
      console.log('Request body:', JSON.stringify(createCaseNoteDto, null, 2));
      console.log('Request user:', JSON.stringify(req.user, null, 2));
      console.log('User ID from req.user.id:', req.user?.id);
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('No user ID found in request');
        throw new Error('User ID not found in request');
      }
      
      console.log('Creating case note with user ID:', userId);
      
      const result = await this.caseNotesService.createCaseNote(createCaseNoteDto, userId);
      console.log('Case note created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('=== CASE NOTE CREATION ERROR ===');
      console.error('Error creating case note:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Get case notes for a specific case
   */
  @Get('case/:caseType/:caseId')
  async getCaseNotes(
    @Param('caseType') caseType: CaseType,
    @Param('caseId') caseId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.caseNotesService.getCaseNotes(caseType, caseId, userId);
  }

  /**
   * Get case note by ID
   */
  @Get(':id')
  async getCaseNoteById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.caseNotesService.getCaseNoteById(id, userId);
  }

  /**
   * Update case note
   */
  @Put(':id')
  async updateCaseNote(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCaseNoteDto>,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.caseNotesService.updateCaseNote(id, updateData, userId);
  }

  /**
   * Mark case note as read
   */
  @Put(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  async markCaseNoteAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.caseNotesService.markCaseNoteAsRead(id, userId);
  }

  /**
   * Delete case note
   */
  @Delete(':id')
  async deleteCaseNote(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.caseNotesService.deleteCaseNote(id, userId);
  }
}
