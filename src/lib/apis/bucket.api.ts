import { Injectable } from '@nestjs/common';
import { PassThrough } from 'node:stream';

export interface GetFileBucketOptions {
  name: string;
  filename: string;
}

export interface BucketFile extends GetFileBucketOptions {
  stream: PassThrough;
}

@Injectable()
export class BucketAPI {
  constructor() {}

  public async getFileStream(
    params: GetFileBucketOptions,
  ): Promise<BucketFile> {
    return new Promise((resolve) =>
      resolve({ ...params, stream: new PassThrough() }),
    );
  }
}
