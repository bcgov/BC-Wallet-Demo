import { cn, convertBase64 } from "./utils";

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
      expect(cn('text-white', 'bg-blue-500')).toBe('text-white bg-blue-500');
    });
  });

  describe('convertBase64', () => {
    it('should convert a file to base64', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = await convertBase64(file);
      expect(result).toBe('data:text/plain;base64,dGVzdA==');
    });
  });
});