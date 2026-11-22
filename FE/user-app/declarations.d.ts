declare module 'dayjs' {
  interface Dayjs {
    format(template?: string): string;
    add(value: number, unit?: any): Dayjs;
    subtract(value: number, unit?: any): Dayjs;
    diff(date: any, unit?: any, float?: boolean): number;
    toDate(): Date;
    toISOString(): string;
    isBefore(date: any): boolean;
    isAfter(date: any): boolean;
    isSame(date: any): boolean;
    isValid(): boolean;
  }
  function dayjs(date?: any, format?: string): Dayjs;
  namespace dayjs {
    type ConfigType = string | number | Date | Dayjs | null | undefined;
  }
  export default dayjs;
}

declare module '@hookform/resolvers/zod' {
  import { Resolver } from 'react-hook-form';
  export function zodResolver(schema: any, schemaOptions?: any, resolverOptions?: any): Resolver<any>;
}
