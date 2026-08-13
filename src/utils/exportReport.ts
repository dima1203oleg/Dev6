
export const exportReport = async (data: any) => {
  console.log('Exporting report', data);
};

export const exportInvestigationPDFReport = async (data: any) => console.log('Exporting PDF', data);
export const exportInvestigationGeoJSON = async (data: any) => console.log('Exporting GeoJSON', data);
export const exportInvestigationCSV = async (data: any) => console.log('Exporting CSV', data);
export const calculateSHA256 = async (_text: string) => 'hash';
