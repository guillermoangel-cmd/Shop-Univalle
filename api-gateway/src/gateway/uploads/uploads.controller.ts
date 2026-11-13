import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import type { Response } from 'express';

const UPLOADS_ROOT = resolve(process.cwd(), 'uploads');
const ALLOWED_FOLDERS = new Set(['products', 'profile']);

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function createDiskStorage(folder: 'products' | 'profile') {
  return diskStorage({
    destination: (
      _req: unknown,
      _file: unknown,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      const target = join(UPLOADS_ROOT, folder);
      ensureDir(target);
      cb(null, target);
    },
    filename: (
      _req: unknown,
      file: { originalname?: string },
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const ext = extname(file.originalname || '').toLowerCase() || '.webp';
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${unique}${ext}`);
    },
  });
}

function imageFileFilter(
  _req: unknown,
  file: { mimetype?: string },
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Solo se permiten archivos de imagen.'), false);
    return;
  }
  cb(null, true);
}

@Controller()
export class UploadsController {
  @Post('api/uploads/products')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDiskStorage('products'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProductImage(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file?: { filename: string },
  ) {
    this.requireAuth(authorization);
    if (!file) {
      throw new BadRequestException('Debes adjuntar una imagen.');
    }
    return { imageUrl: `/uploads/products/${file.filename}` };
  }

  @Post('api/uploads/product-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: createDiskStorage('products'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProductImageLegacy(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file?: { filename: string },
  ) {
    this.requireAuth(authorization);
    if (!file) {
      throw new BadRequestException('Debes adjuntar una imagen.');
    }
    return { imageUrl: `/uploads/products/${file.filename}` };
  }

  @Post('api/uploads/profile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDiskStorage('profile'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProfileImage(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file?: { filename: string },
  ) {
    this.requireAuth(authorization);
    if (!file) {
      throw new BadRequestException('Debes adjuntar una imagen.');
    }
    return { imageUrl: `/uploads/profile/${file.filename}` };
  }

  @Delete('api/uploads/products/:productId')
  deleteProductImage(
    @Headers('authorization') authorization: string | undefined,
    @Body() body?: { imageUrl?: string },
  ) {
    this.requireAuth(authorization);
    return { deleted: this.tryDeleteImage(body?.imageUrl, 'products') };
  }

  @Delete('api/uploads/product-image/:filename')
  deleteProductImageByFilename(
    @Headers('authorization') authorization: string | undefined,
    @Param('filename') filename: string,
  ) {
    this.requireAuth(authorization);
    return {
      deleted: this.tryDeleteImage(`/uploads/products/${filename}`, 'products'),
    };
  }

  @Delete('api/uploads/profile')
  deleteProfileImage(
    @Headers('authorization') authorization: string | undefined,
    @Body() body?: { imageUrl?: string },
  ) {
    this.requireAuth(authorization);
    return { deleted: this.tryDeleteImage(body?.imageUrl, 'profile') };
  }

  @Get('uploads/:folder/:filename')
  serveUploadedFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!ALLOWED_FOLDERS.has(folder)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    const safeName = basename(filename);
    const fullPath = join(UPLOADS_ROOT, folder, safeName);
    if (!existsSync(fullPath)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return res.sendFile(fullPath);
  }

  private requireAuth(authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Se requiere autenticación para subir imágenes.',
      );
    }
  }

  private tryDeleteImage(
    imageUrl: string | undefined,
    folder: 'products' | 'profile',
  ): boolean {
    if (!imageUrl || !imageUrl.startsWith(`/uploads/${folder}/`)) {
      return false;
    }
    const safeName = basename(imageUrl);
    const fullPath = join(UPLOADS_ROOT, folder, safeName);
    if (!existsSync(fullPath)) {
      return false;
    }
    try {
      unlinkSync(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
