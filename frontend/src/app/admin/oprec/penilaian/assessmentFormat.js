export const CRITERIA = [
  ["pemahaman", "Pemahaman"], ["kepribadian", "Kepribadian"],
  ["public_speaking", "Public Speaking"], ["kejujuran", "Kejujuran"],
  ["problem_solving", "Problem Solving"], ["kerja_sama", "Kerja Sama"],
];
const numberFormat = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const scoreText = (value) => value === null || value === undefined ? "" : String(value).replace(".", ",");
export const formattedTotal = (value) => value === null || value === undefined ? "—" : numberFormat.format(value);
export const errorMessage = (error, fallback) => Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || fallback;
