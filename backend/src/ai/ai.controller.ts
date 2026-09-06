import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('AI Assistant')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({ summary: 'Ask AI assistant questions about team activity, blockers, and achievements (Manager only)' })
  @ApiResponse({ status: 200, description: 'Returns AI-generated contextual analysis and answer.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required.' })
  @Post('chat')
  @Roles(UserRole.MANAGER)
  async chat(@Body() chatDto: AiChatDto) {
    return this.aiService.askAssistant(chatDto.query);
  }
}
