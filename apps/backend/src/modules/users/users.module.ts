import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRegistrationService } from './user-registration.service';
import { UserRegistrationController } from './user-registration.controller';

@Module({
  controllers: [UsersController, UserRegistrationController],
  providers: [UsersService, UserRegistrationService],
  exports: [UsersService, UserRegistrationService],
})
export class UsersModule {}