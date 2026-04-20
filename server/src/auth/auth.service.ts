import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwt: JwtService,
  ) {}

  /* ---------------- REGISTER ---------------- */
  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      ...dto,
      password: hashedPassword,
    });

    return {
      success: true,
      message: 'Register successful',
      data: { userId: user._id },
    };
  }

  /* ---------------- LOGIN ---------------- */
  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('Please create an account first');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
    };

    const accessExpiry  = process.env.JWT_ACCESS_EXPIRES_IN  ?? '15m';
    const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

    /* Access Token (1 min) */
    const accessToken = this.jwt.sign(payload, {
      expiresIn: accessExpiry as any,
    });

    /* Refresh Token (7 days) */
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: refreshExpiry as any,
    });

    /* Hash refresh token before saving */
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    user.refreshToken = hashedRefresh;
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
      },
    };
  }

 
  // async logout(userId: string) {
  //   await this.userModel.updateOne(
  //     { _id: userId },
  //     { $set: { refreshToken: null } },
  //   );
  //   return { success: true };
  // }
   async logout(refreshToken?: string) {
    if (!refreshToken) return { success: true };

    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken);
    } catch {
      return { success: true };
    }

    await this.userModel.updateOne(
      { _id: payload.sub },
      { $set: { refreshToken: null } },
    );
    return { success: true };
  }

  /* ---------------- REFRESH ---------------- */
  async refresh(req: any) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    /* Generate new tokens (ROTATION) */
    const newPayload = { sub: user._id, email: user.email };

    const accessExpiry  = process.env.JWT_ACCESS_EXPIRES_IN  ?? '15m';
    const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

    const newAccessToken  = this.jwt.sign(newPayload, { expiresIn: accessExpiry as any });
    const newRefreshToken = this.jwt.sign(newPayload, { expiresIn: refreshExpiry as any });

    /* Save new hashed refresh token */
    user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    return {
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
