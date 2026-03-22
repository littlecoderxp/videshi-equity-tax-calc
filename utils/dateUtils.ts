export const getFinancialYearBounds = (dateString: string) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { start: '', end: '' };

  const year = d.getFullYear();
  // Financial year starts April 1 (Month index 3) and ends March 31
  // If month is Jan(0), Feb(1), Mar(2), it belongs to the previous calendar year's FY.
  const isJanToMar = d.getMonth() < 3;
  const fyStartYear = isJanToMar ? year - 1 : year;
  
  return {
    start: `${fyStartYear}-04-01`,
    end: `${fyStartYear + 1}-03-31`,
  };
};

export const MIN_ALLOWED_DATE = '2024-04-01';
