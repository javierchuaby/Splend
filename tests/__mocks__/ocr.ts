export const mockOcrResult = {
  text: 'Item1 2.50\nItem2 8.00\nTotal 10.50',
  items: [
    { name: 'Item1', price: 2.5 },
    { name: 'Item2', price: 8 },
  ],
  total: 10.5,
};

export const mockOcr = {
  scanImage: jest.fn().mockResolvedValue(mockOcrResult),
};