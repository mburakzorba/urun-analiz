import { ProductAnalysis } from "../types";

export type RootStackParamList = {
  Home: undefined;
  Scan: undefined;
  Analyzing: { imageUri: string; backImageUri?: string; barcode?: string };
  Result: { analysis: ProductAnalysis };
  History: undefined;
  Paywall: undefined;
  Profile: undefined;
  Compare: { a: ProductAnalysis; b: ProductAnalysis };
};