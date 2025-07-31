// Static data and constants for the EU Sustainability Questionnaire

export interface LabelMapping {
  [key: string]: string;
}

// Employee count labels
export const EMPLOYEE_LABELS: LabelMapping = {
  'under_10': 'Under 10',
  '10_49': '10-49',
  '50_249': '50-249',
  '250_499': '250-499',
  '500_999': '500-999',
  '1000_2999': '1,000-2,999',
  '3000_plus': '3,000+',
  'under_250': 'Under 250'
};

// Turnover amount labels
export const TURNOVER_LABELS: LabelMapping = {
  'under_2m': 'Under €2M',
  '2_10m': '€2-10M',
  '10_50m': '€10-50M',
  '50_80m': '€50-80M',
  '80_150m': '€80-150M',
  '150_450m': '€150-450M',
  '450_900m': '€450-900M',
  '900m_plus': '€900M+',
  'under_50m': 'Under €50M',
  '50_450m': '€50-450M'
};

// Balance sheet labels
export const BALANCE_SHEET_LABELS: LabelMapping = {
  'under_2m': 'Under €2M',
  '2_5m': '€2-5M',
  '5_25m': '€5-25M',
  '25_43m': '€25-43M',
  '43_450m': '€43-450M',
  '450m_plus': '€450M+',
  'under_25m': 'Under €25M',
  '25_450m': '€25-450M'
};

// Law names and descriptions
export const LAW_NAMES: LabelMapping = {
  ungps: 'UN Guiding Principles',
  oecd: 'OECD Guidelines',
  csrd: 'CSRD/ESRS',
  taxonomy: 'EU Taxonomy',
  csddd: 'CSDDD'
};

export const LAW_DESCRIPTIONS: LabelMapping = {
  ungps: 'International framework for business responsibility to respect human rights.',
  oecd: 'Guidelines for responsible business conduct by multinational enterprises.',
  csrd: 'EU directive requiring detailed sustainability reporting and third-party assurance.',
  taxonomy: 'EU classification system defining environmentally sustainable economic activities.',
  csddd: 'EU directive mandating human rights and environmental due diligence across value chains.'
};

export const LAW_DETAILS: LabelMapping = {
  ungps: 'The UN Guiding Principles on Business and Human Rights establish that all businesses have a responsibility to respect human rights. This includes conducting human rights due diligence to identify, prevent, and mitigate adverse impacts, and providing access to remedy when harm occurs. The principles apply regardless of company size, sector, operational context, ownership, or structure.',
  oecd: 'The OECD Guidelines for Multinational Enterprises provide recommendations for responsible business conduct. They cover human rights, employment relations, environment, bribery, consumer interests, and other areas. While voluntary, they represent the most comprehensive international framework for corporate responsibility and are backed by a unique grievance mechanism.',
  csrd: 'The Corporate Sustainability Reporting Directive requires companies to disclose information about their impact on people and the environment, and how sustainability matters affect their business. Reports must follow the European Sustainability Reporting Standards (ESRS) and undergo mandatory third-party assurance. This creates transparency and accountability for corporate sustainability performance.',
  taxonomy: 'The EU Taxonomy Regulation establishes criteria for determining whether economic activities qualify as environmentally sustainable. Companies subject to CSRD must disclose the proportion of their activities that align with taxonomy criteria. This helps investors identify sustainable investments and supports the EU\'s climate and environmental goals.',
  csddd: 'The Corporate Sustainability Due Diligence Directive requires companies to identify, prevent, mitigate, and account for negative human rights and environmental impacts in their operations and value chains. This includes establishing due diligence processes, engaging with stakeholders, and providing access to remedy. The directive aims to promote sustainable and responsible corporate behavior globally.'
};

// Taxonomy details
export const TAXONOMY_OBJECTIVES = [
  'Climate change mitigation',
  'Climate change adaptation', 
  'Sustainable use and protection of water and marine resources',
  'Transition to a circular economy',
  'Pollution prevention and control',
  'Protection and restoration of biodiversity and ecosystems'
];

export const TAXONOMY_KPIS = ['Turnover', 'CapEx', 'OpEx'];

// Helper functions for label retrieval
export const getEmployeeLabel = (employeeValue: string): string => {
  return EMPLOYEE_LABELS[employeeValue] || 'Not specified';
};

export const getTurnoverLabel = (turnoverValue: string): string => {
  return TURNOVER_LABELS[turnoverValue] || 'Not specified';
};

export const getBalanceSheetLabel = (balanceValue: string): string => {
  return BALANCE_SHEET_LABELS[balanceValue] || 'Not specified';
};