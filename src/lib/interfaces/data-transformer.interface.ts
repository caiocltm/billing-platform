export interface DataTransformer<TInput, TOutput> {
  transform(data: TInput): TOutput;
}
