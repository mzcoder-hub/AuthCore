import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.applicationService.getApplicationsPaginated({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      type,
    });
  }

  @Get(':id/users')
  async listApplicationUsers(@Param('id') applicationId: string) {
    return this.applicationService.listApplicationUsers(applicationId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const app = await this.applicationService.findById(id);
    if (!app) throw new NotFoundException();
    return app;
  }

  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.applicationService.delete(id);
  }
}
