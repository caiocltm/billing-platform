import { Injectable } from '@nestjs/common';
import { PassThrough } from 'node:stream';

export type GetFileBucketOptions = {
  filename: string;
};

export type UploadFileBucketOptions = {
  filename: string;
  path: string;
};

export type BucketFileType = GetFileBucketOptions & {
  stream: PassThrough;
};

export class BucketFile {
  private readonly filename: string;
  private readonly stream: PassThrough;

  constructor(filename: string) {
    this.filename = filename;
    this.stream = new PassThrough();
  }

  getFilename(): string {
    return this.filename;
  }

  getFileStream(): PassThrough {
    return this.stream;
  }
}

@Injectable()
export class BucketAPI {
  constructor() {}

  public async uploadFromPath(
    uploadFileBucketOptions: UploadFileBucketOptions,
  ): Promise<BucketFile> {
    return new Promise((resolve) =>
      resolve(new BucketFile(uploadFileBucketOptions.filename)),
    );
  }

  public async getFileStream(
    params: GetFileBucketOptions,
  ): Promise<BucketFile> {
    return new Promise((resolve) => resolve(new BucketFile(params.filename)));
  }
}
