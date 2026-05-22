import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../user/repository/user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
  constructor(
    private UserRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signIn(userName: string, passWord: string) {
    const user = await this.UserRepository.findByUserName(userName);

    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(passWord, user.passWord);

    if (!isMatch) throw new UnauthorizedException('Invalid password');

    const payload = { id: user.id, userName: user.userName, role: user.role };
    return {
      user: {
        id: user.id,
        userName: user.userName,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
    };
  }
}
