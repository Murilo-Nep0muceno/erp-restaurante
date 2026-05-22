import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  get() {
    return this.prisma.setting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async getPublic() {
    const setting = await this.get();
    return { restaurantName: setting.restaurantName };
  }

  update(data: UpdateSettingsDto) {
    return this.prisma.setting.upsert({
      where: { id: SINGLETON_ID },
      update: data,
      create: { id: SINGLETON_ID, ...data },
    });
  }
}
