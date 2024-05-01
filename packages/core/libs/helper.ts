import { round } from "lodash";

export function convertToDollars(cents: number) {
  return round(cents / 100);
}

export function convertToCents(dollars: number) {
  return round(dollars * 100);
}
