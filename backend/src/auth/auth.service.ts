import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email: email.toLowerCase().trim(),
      name,
      password_hash,
      role: role || UserRole.TEAM_MEMBER,
    });

    const savedUser = await this.userRepository.save(user);

    const payload = { sub: savedUser.id, email: savedUser.email, role: savedUser.role };
    const access_token = this.jwtService.sign(payload);

    const { password_hash: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      access_token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token,
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: number, updateDto: { name?: string; email?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (updateDto.name) {
      user.name = updateDto.name.trim();
    }
    if (updateDto.email) {
      const emailClean = updateDto.email.toLowerCase().trim();
      if (emailClean !== user.email) {
        const existing = await this.userRepository.findOne({ where: { email: emailClean } });
        if (existing) {
          throw new ConflictException('User with this email already exists');
        }
        user.email = emailClean;
      }
    }

    const savedUser = await this.userRepository.save(user);
    const { password_hash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }
}
