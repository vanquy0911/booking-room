import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../commons/decorators/user.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createOrganization(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @User('id') userId: string,
  ) {
    return this.organizationService.create(createOrganizationDto, userId);
  }

  @Post('invite/:orgId')
  @ApiOperation({ summary: 'Invite member to organization' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  inviteMember(
    @Param('orgId') orgId: string, // <--- Sửa 'String' thành 'string' (viết thường)
    @Body() inviteDto: InviteMemberDto,
    @User('id') userId: string,
  ) {
    return this.organizationService.inviteMember(orgId, inviteDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get organization by user id' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAllByUser(@User('id') userId: string) {
    return this.organizationService.findAllByUser(userId);
  }

  @Get('register')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  registerPage(
    @Query('invitation_token') token: string,
  ) {
    return this.organizationService.verifyInvitation(token);
  }

  @Post('accept-invite')
  @ApiOperation({ summary: 'Accept an invitation to join an organization' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async acceptInvite(
    @Body('invitation_token') token: string,
    @User('id') userId: string,
  ) {
    await this.organizationService.acceptInvitation(token, userId);
    return { message: 'Chấp nhận lời mời thành công' };
  }

  @Get(':orgId/members')
  @ApiOperation({ summary: 'Get members of an organization' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  getMembers(
    @Param('orgId') orgId: string,
    @User('id') userId: string,
  ) {
    return this.organizationService.getMembers(orgId, userId);
  }
}