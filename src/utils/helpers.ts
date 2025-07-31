// Helper functions for EU Sustainability Questionnaire assessment logic
import { getEmployeeLabel, getTurnoverLabel, getBalanceSheetLabel, TAXONOMY_OBJECTIVES, TAXONOMY_KPIS } from '../data/constants';

export interface Answers {
  [key: string]: string;
}

// CSDDD threshold checking functions
export const checkCSDDDIndividualThresholds = (answers: Answers): boolean => {
  const hasEmployees = ['1000_2999', '3000_plus'].includes(answers.employees_individual);
  const hasTurnover = ['450_900m', '900m_plus'].includes(answers.turnover_individual);
  return hasEmployees && hasTurnover;
};

export const checkCSDDDGroupThresholds = (answers: Answers): boolean => {
  const hasEmployees = ['1000_2999', '3000_plus'].includes(answers.employees_consolidated);
  const hasTurnover = ['450_900m', '900m_plus'].includes(answers.turnover_consolidated);
  return hasEmployees && hasTurnover;
};

export const checkCSDDDFranchisingThresholds = (answers: Answers): boolean => {
  if (answers.has_franchising_licensing !== 'yes') return false;
  
  const meetsTurnoverThreshold = ['80_150m', '150_450m', '450_900m', '900m_plus'].includes(answers.turnover_individual);
  
  if (answers.jurisdiction === 'eu') {
    return answers.franchising_licensing === 'yes_meets_criteria' && 
           answers.franchise_royalties === 'yes' && 
           meetsTurnoverThreshold;
  } else {
    return answers.franchising_licensing === 'yes_meets_criteria' && 
           answers.franchise_eu_royalties === 'yes' && 
           meetsTurnoverThreshold;
  }
};

// CSDDD Non-EU threshold checking functions
export const checkCSDDDNonEUIndividualThresholds = (answers: Answers): boolean => {
  // >€450M EU turnover (2 FYs preceding last FY)
  return ['450_900m', '900m_plus'].includes(answers.turnover_individual);
};

export const checkCSDDDNonEUGroupThresholds = (answers: Answers): boolean => {
  // Ultimate parent: >€450M EU turnover at group level
  return ['450_900m', '900m_plus'].includes(answers.turnover_consolidated);
};

// CSDDD Individual franchising functions
export const checkCSDDDIndividualFranchising = (answers: Answers): boolean => {
  // Individual: €22.5M royalties AND €80M global turnover
  const meetsTurnoverThreshold = ['80_150m', '150_450m', '450_900m', '900m_plus'].includes(answers.turnover_individual);
  
  return answers.has_franchising_licensing === 'yes' &&
         answers.franchising_licensing === 'yes_meets_criteria' && 
         answers.franchise_royalties === 'yes' && 
         meetsTurnoverThreshold;
};

export const checkCSDDDGroupFranchising = (answers: Answers): boolean => {
  // Ultimate parent of group: €22.5M royalties AND €80M global turnover (group level)
  // Note: Current questionnaire doesn't distinguish group-level franchising
  // For now, we'll use individual franchising answers as proxy
  return checkCSDDDIndividualFranchising(answers);
};

export const checkCSDDDNonEUIndividualFranchising = (answers: Answers): boolean => {
  // Individual: €22.5M EU royalties AND €80M EU turnover
  const meetsTurnoverThreshold = ['80_150m', '150_450m', '450_900m', '900m_plus'].includes(answers.turnover_individual);
  
  return answers.has_franchising_licensing === 'yes' &&
         answers.franchising_licensing === 'yes_meets_criteria' && 
         answers.franchise_eu_royalties === 'yes' && 
         meetsTurnoverThreshold;
};

export const checkCSDDDNonEUGroupFranchising = (answers: Answers): boolean => {
  // Ultimate parent: €22.5M EU royalties AND €80M EU turnover (group level)
  return checkCSDDDNonEUIndividualFranchising(answers);
};

// CSRD checking functions
export const checkLargeUndertaking = (answers: Answers): boolean => {
  const employees = ['250_499', '500_999', '1000_2999', '3000_plus'].includes(answers.employees_individual);
  const turnover = !['under_2m', '2_10m', '10_50m'].includes(answers.turnover_individual);
  const balanceSheet = answers.balance_sheet_individual === '25m_plus';
  
  let criteria = 0;
  if (employees) criteria++;
  if (turnover) criteria++;
  if (balanceSheet) criteria++;
  
  return criteria >= 2;
};

export const checkListedSME = (answers: Answers): boolean => {
  return answers.listing_status === 'listed_eu' && 
         !['under_10'].includes(answers.employees_individual) && 
         !checkLargeUndertaking(answers);
};

export const checkParentOfLargeGroup = (answers: Answers): boolean => {
  if (answers.parent_status !== 'yes') return false;
  
  const employees = ['250_499', '500_999', '1000_2999', '3000_plus'].includes(answers.employees_consolidated);
  const turnover = answers.turnover_consolidated === '50_450m' || 
                   answers.turnover_consolidated === '450_900m' || 
                   answers.turnover_consolidated === '900m_plus';
  const balanceSheet = answers.balance_sheet_consolidated === '25m_plus';
  
  let criteria = 0;
  if (employees) criteria++;
  if (turnover) criteria++;
  if (balanceSheet) criteria++;
  
  return criteria >= 2;
};

export const isThirdCountryInScope = (answers: Answers): boolean => {
  // Exclude companies with EU securities trading (they follow EU pathway)
  if (answers.eu_securities_trading === 'yes') {
    return false;
  }

  // Consecutive years requirement is already captured in eu_turnover_threshold
  // No separate verification needed

  // Path 1: EU turnover + qualifying presence (Article 40a)
  if (answers.eu_turnover_threshold === 'both_over_150m') {
    // Check for qualifying subsidiary first (takes priority over branch)
    const hasQualifyingSubsidiary = answers.eu_subsidiary_qualification === 'large_undertaking' || 
                                   answers.eu_subsidiary_qualification === 'listed_sme';
    
    if (hasQualifyingSubsidiary) {
      return true;
    }

    // Check for qualifying branch (only if no qualifying subsidiary)
    const hasQualifyingBranch = answers.eu_branch_turnover === 'over_40m';
    
    if (hasQualifyingBranch) {
      return true;
    }
  }

  return false;
};

// Assessment timeline functions
export const assessCSDDDTimeline = (pathwayType: string, answers: Answers) => {
  let wave, timeline, reason;
  
  // Determine if company meets Wave 1 thresholds (higher thresholds)
  const meetsWave1Individual = answers.employees_individual === '3000_plus' && 
                              answers.turnover_individual === '900m_plus';
  const meetsWave1Group = answers.employees_consolidated === '3000_plus' && 
                         answers.turnover_consolidated === '900m_plus';
  const meetsWave1NonEU = answers.turnover_individual === '900m_plus'; // Non-EU: only turnover matters
  
  // Determine timeline based on pathway and thresholds
  if (pathwayType.includes('non_eu')) {
    if (meetsWave1NonEU) {
      wave = 1;
      timeline = 'Wave 1: From 26 July 2028';
    } else {
      wave = 2;
      timeline = 'Wave 2: From 26 July 2029';
    }
  } else {
    // EU companies
    if ((pathwayType.includes('individual') && meetsWave1Individual) ||
        (pathwayType.includes('group') && meetsWave1Group)) {
      wave = 1;
      timeline = 'Wave 1: From 26 July 2028';
    } else {
      wave = 2;
      timeline = 'Wave 2: From 26 July 2029';
    }
  }
  
  // Generate reason based on pathway
  switch (pathwayType) {
    case 'individual_eu_company':
      reason = meetsWave1Individual 
        ? '3,000+ employees and €900M+ global turnover (individual).'
        : '1,000+ employees and €450M+ global turnover (individual).';
      break;
    case 'ultimate_parent_eu_group':
      reason = meetsWave1Group
        ? '3,000+ employees and €900M+ global turnover (group level).'
        : '1,000+ employees and €450M+ global turnover (group level).';
      break;
    case 'individual_eu_franchising':
      reason = 'EU franchising agreements with €22.5M+ royalties and €80M+ global turnover (individual).';
      break;
    case 'ultimate_parent_eu_franchising':
      reason = 'EU franchising agreements with €22.5M+ royalties and €80M+ global turnover (group level).';
      break;
    case 'individual_non_eu_company':
      reason = meetsWave1NonEU
        ? '€900M+ EU turnover (individual).'
        : '€450M+ EU turnover (individual).';
      break;
    case 'ultimate_parent_non_eu_group':
      reason = (answers.turnover_consolidated === '900m_plus')
        ? '€900M+ EU turnover (group level).'
        : '€450M+ EU turnover (group level).';
      break;
    case 'individual_non_eu_franchising':
      reason = 'EU franchising agreements with €22.5M+ EU royalties and €80M+ EU turnover (individual).';
      break;
    case 'ultimate_parent_non_eu_franchising':
      reason = 'EU franchising agreements with €22.5M+ EU royalties and €80M+ EU turnover (group level).';
      break;
    default:
      reason = 'Meets CSDDD thresholds.';
  }
  
  return {
    inScope: true,
    reason,
    timeline,
    wave,
    legalBasis: 'Directive (EU) 2024/1760 (CSDDD)',
    consecutiveYearsNote: 'Obligations begin only after meeting thresholds for two consecutive financial years.'
  };
};

// Taxonomy details function
export const getTaxonomyDetails = (answers: Answers) => {
  const details = {
    kpis: TAXONOMY_KPIS,
    objectives: TAXONOMY_OBJECTIVES,
    phaseIn: null as any
  };

  // Determine phase-in based on undertaking type
  if (answers.undertaking_type === 'non_financial') {
    details.phaseIn = {
      current: 'Since 2025 (for FY 2024): Full reporting on eligibility and alignment for all 6 environmental objectives.',
      type: 'Non-financial undertaking'
    };
  } else if (answers.undertaking_type === 'financial') {
    const financialType = answers.financial_type;
    
    if (financialType === 'credit_institution' || financialType === 'snci') {
      details.phaseIn = {
        current: 'Since 2025 (for FY 2024): KPIs on alignment for objectives 1-2, eligibility for objectives 1-6.',
        future: 'From 2026 (for FY 2025): Full reporting on eligibility and alignment for all 6 objectives.',
        additional: financialType === 'credit_institution' ? 'From 2026: Additionally report on alignment of trading book and fees/commissions for non-banking activities.' : null,
        type: financialType === 'snci' ? 'Small and non-complex institution' : 'Credit institution'
      };
    } else if (financialType === 'insurance_company' || financialType === 'captive_insurance') {
      details.phaseIn = {
        current: 'Since 2025 (for FY 2024): KPIs on alignment for objectives 1-2, eligibility for objectives 1-6.',
        future: 'From 2026 (for FY 2025): Full reporting on eligibility and alignment for all 6 objectives.',
        type: financialType === 'captive_insurance' ? 'Captive insurance/reinsurance undertaking' : 'Insurance undertaking'
      };
    } else if (financialType === 'investment_firm' || financialType === 'asset_manager') {
      details.phaseIn = {
        current: 'Since 2025 (for FY 2024): KPIs on alignment for objectives 1-2, eligibility for objectives 1-6.',
        future: 'From 2026 (for FY 2025): Full reporting on eligibility and alignment for all 6 objectives.',
        type: financialType === 'asset_manager' ? 'Asset manager' : 'Investment firm'
      };
    }
  }

  return details;
};

// Future compliance considerations functions
export const addFutureComplianceConsiderations = (assessment: any, answers: Answers): void => {
  // Only add considerations if user expects growth
  if (answers.future_thresholds !== 'yes' && answers.future_thresholds !== 'maybe') {
    return;
  }

  const growthMetrics = answers.growth_metrics || '';
  const isEU = answers.jurisdiction === 'eu';

  // CSRD Future Considerations
  if (!assessment.csrd.inScope) {
    const csrdConsiderations = getCSRDFutureConsiderations(growthMetrics, isEU, answers);
    if (csrdConsiderations) {
      assessment.csrd.futureConsiderations = csrdConsiderations;
    }
  }

  // CSDDD Future Considerations  
  if (!assessment.csddd.inScope) {
    const csdddConsiderations = getCSDDDFutureConsiderations(growthMetrics, isEU, answers);
    if (csdddConsiderations) {
      assessment.csddd.futureConsiderations = csdddConsiderations;
    }
  }

  // EU Taxonomy follows CSRD, so if CSRD has future considerations, Taxonomy might too
  if (!assessment.taxonomy.inScope && assessment.csrd.futureConsiderations) {
    assessment.taxonomy.futureConsiderations = 'Given your projected growth, your company might become subject to EU Taxonomy disclosure obligations if it falls under CSRD scope (Articles 19a/29a) in the future.';
  }
};

export const getCSRDFutureConsiderations = (growthMetrics: string, isEU: boolean, answers: Answers): string | null => {
  const considerations = [];
  
  // Large Undertaking criteria (need 2 of 3)
  if (growthMetrics === 'multiple' || 
      growthMetrics === 'employees' || 
      growthMetrics === 'turnover' || 
      growthMetrics === 'balance_sheet') {
    
    let thresholdText = '';
    if (isEU) {
      thresholdText = 'employs more than 250 people, generates global turnover exceeding €50 million, and maintains global balance sheet totals above €25 million';
    } else {
      // For non-EU companies, they need to meet Article 40a criteria or have EU securities
      thresholdText = 'generates EU turnover exceeding €150 million for two consecutive financial years and has qualifying EU subsidiaries or branches exceeding €40 million EU turnover';
    }
    
    considerations.push(`Given your projected growth, your company might fall under CSRD obligations if it meets at least two of the following criteria for two consecutive financial years: ${thresholdText}.`);
  }

  // Parent of Large Group considerations
  if (answers.parent_status === 'yes' && (growthMetrics === 'multiple' || growthMetrics === 'employees' || growthMetrics === 'turnover' || growthMetrics === 'balance_sheet')) {
    let groupText = '';
    if (isEU) {
      groupText = 'employs more than 250 people (consolidated), generates global turnover exceeding €50 million (consolidated), and maintains global balance sheet totals above €25 million (consolidated)';
    } else {
      groupText = 'generates EU turnover exceeding €150 million for two consecutive financial years and has qualifying EU subsidiaries or branches';
    }
    
    considerations.push(`As a parent company, your group might fall under CSRD consolidated reporting obligations if it meets at least two of the following criteria for two consecutive financial years: ${groupText}.`);
  }

  return considerations.length > 0 ? considerations.join(' ') : null;
};

export const getCSDDDFutureConsiderations = (growthMetrics: string, isEU: boolean, answers: Answers): string | null => {
  const considerations = [];
  
  // Individual CSDDD thresholds (needs BOTH employees AND turnover)
  if (growthMetrics === 'multiple' || 
      (growthMetrics === 'employees' || growthMetrics === 'turnover')) {
    
    let thresholdText = '';
    if (isEU) {
      thresholdText = 'employs more than 1,000 people and generates global turnover exceeding €450 million for two consecutive financial years';
    } else {
      thresholdText = 'generates EU turnover exceeding €450 million for two consecutive financial years';
    }
    
    considerations.push(`Given your projected growth, your company might fall under CSDDD obligations if it ${thresholdText}.`);
    
    // Mention both requirements if user only selected one metric
    if (isEU && (growthMetrics === 'employees' || growthMetrics === 'turnover')) {
      considerations.push(`Note: CSDDD requires meeting both employee and turnover thresholds simultaneously.`);
    }
  }

  // Ultimate Parent of Group considerations
  if (answers.parent_status === 'yes' && answers.subsidiary_status === 'no' && 
      (growthMetrics === 'multiple' || growthMetrics === 'employees' || growthMetrics === 'turnover')) {
    
    let groupText = '';
    if (isEU) {
      groupText = 'employs more than 1,000 people (consolidated) and generates global turnover exceeding €450 million (consolidated) for two consecutive financial years';
    } else {
      groupText = 'generates EU turnover exceeding €450 million (consolidated) for two consecutive financial years';
    }
    
    considerations.push(`As an ultimate parent company, your group might fall under CSDDD obligations if it ${groupText}.`);
  }

  // Franchising considerations
  if (answers.has_franchising_licensing === 'yes' && answers.franchising_licensing === 'yes_meets_criteria' && 
      growthMetrics === 'turnover') {
    
    let franchisingText = '';
    if (isEU) {
      franchisingText = 'generates global turnover exceeding €80 million and receives royalties exceeding €22.5 million from qualifying franchising/licensing agreements';
    } else {
      franchisingText = 'generates EU turnover exceeding €80 million and receives EU royalties exceeding €22.5 million from qualifying franchising/licensing agreements';
    }
    
    considerations.push(`Your company might also fall under CSDDD through franchising/licensing criteria if it ${franchisingText} for two consecutive financial years.`);
  }

  return considerations.length > 0 ? considerations.join(' ') : null;
};

// CSRD and CSDDD detailed explanation functions
export const generateDetailedCSRDExplanation = (treatAsEUEntity: boolean, category: string, answers: Answers) => {
  let explanation = 'CSRD assessment: ';
  
  if (category === 'third_country') {
    // Non-EU Article 40a analysis
    explanation += `Article 40a analysis - EU securities trading: ${answers.eu_securities_trading === 'yes' ? 'Yes (would be in scope)' : 'No'}; `;
    
    if (answers.eu_securities_trading === 'no') {
      const turnoverLabel = getTurnoverLabel(answers.turnover_individual);
      explanation += `EU turnover: ${turnoverLabel} (need >€150M for two consecutive years); `;
      
      if (answers.eu_turnover_threshold === 'both_over_150m') {
        explanation += 'EU turnover threshold met but ';
        if (answers.consecutive_years_article40a === 'no') {
          explanation += 'consecutive years requirement not satisfied; ';
        } else if (answers.consecutive_years_article40a === 'uncertain') {
          explanation += 'consecutive years requirement uncertain; ';
        } else {
          explanation += 'consecutive years not verified; ';
        }
        
        // Analyze EU presence
        explanation += `EU presence: ${answers.eu_corporate_presence || 'not specified'}; `;
        if (answers.eu_subsidiary_qualification) {
          explanation += `EU subsidiary qualification: ${answers.eu_subsidiary_qualification === 'large_undertaking' ? 'Large undertaking' : 
            answers.eu_subsidiary_qualification === 'listed_sme' ? 'Listed SME' : 
            answers.eu_subsidiary_qualification === 'other_sme' ? 'Other SME (not qualifying)' :
            answers.eu_subsidiary_qualification === 'micro_undertaking' ? 'Micro-undertaking (not qualifying)' :
            'None'}; `;
        }
        if (answers.eu_branch_turnover) {
          const branchStatus = answers.eu_branch_turnover === 'over_40m' ? 'Over €40M (qualifying)' : '€40M or under (not qualifying)';
          explanation += `EU branch turnover: ${branchStatus}.`;
        }
      } else {
        explanation += 'EU turnover threshold not met.';
      }
    }
  } else if (treatAsEUEntity) {
    // EU entity analysis
    const empLabel = getEmployeeLabel(answers.employees_individual);
    const turnoverLabel = getTurnoverLabel(answers.turnover_individual);
    const balanceLabel = getBalanceSheetLabel(answers.balance_sheet_individual);
    
    // Large undertaking analysis
    const employees = ['250_499', '500_999', '1000_2999', '3000_plus'].includes(answers.employees_individual);
    const turnover = !['under_2m', '2_10m', '10_50m'].includes(answers.turnover_individual);
    const balanceSheet = answers.balance_sheet_individual === '25m_plus';
    const criteriaCount = [employees, turnover, balanceSheet].filter(Boolean).length;
    
    explanation += `Large undertaking criteria (need 2 of 3) - employees: ${empLabel} (${employees ? '✓' : '✗'}), turnover: ${turnoverLabel} (${turnover ? '✓' : '✗'}), balance sheet: ${balanceLabel} (${balanceSheet ? '✓' : '✗'}) - meets ${criteriaCount}/3 criteria; `;
    
    // Group analysis
    if (answers.parent_status === 'yes') {
      const empGroupLabel = getEmployeeLabel(answers.employees_consolidated);
      const turnoverGroupLabel = getTurnoverLabel(answers.turnover_consolidated);
      const balanceGroupLabel = getBalanceSheetLabel(answers.balance_sheet_consolidated);
      
      const groupEmployees = ['250_499', '500_999', '1000_2999', '3000_plus'].includes(answers.employees_consolidated);
      const groupTurnover = answers.turnover_consolidated === '50_450m' || 
                           answers.turnover_consolidated === '450_900m' || 
                           answers.turnover_consolidated === '900m_plus';
      const groupBalanceSheet = answers.balance_sheet_consolidated === '25m_plus';
      const groupCriteriaCount = [groupEmployees, groupTurnover, groupBalanceSheet].filter(Boolean).length;
      
      explanation += `Parent of large group criteria (need 2 of 3) - consolidated employees: ${empGroupLabel} (${groupEmployees ? '✓' : '✗'}), consolidated turnover: ${turnoverGroupLabel} (${groupTurnover ? '✓' : '✗'}), consolidated balance sheet: ${balanceGroupLabel} (${groupBalanceSheet ? '✓' : '✗'}) - meets ${groupCriteriaCount}/3 criteria; `;
    } else {
      explanation += 'Parent status: No; ';
    }
    
    // PIE and listing analysis
    const isPIE = answers.listing_status === 'listed_eu' || answers.public_interest === 'yes';
    const isListed = answers.listing_status === 'listed_eu';
    explanation += `Public Interest Entity: ${isPIE ? 'Yes' : 'No'}; Listed on EU market: ${isListed ? 'Yes' : 'No'}; `;
    
    // Micro-undertaking check
    const isMicro = answers.employees_individual === 'under_10';
    if (isMicro) {
      explanation += 'Micro-undertaking status: Yes (excluded from CSRD).';
    }
  } else {
    explanation += 'Jurisdiction not determined or insufficient information.';
  }
  
  return {
    inScope: false,
    reason: explanation,
    timeline: '',
    wave: null,
    reportingType: null,
    automaticExemptions: [],
    possibleExemptions: [],
    legalBasis: null
  };
};

export const generateDetailedCSDDDExplanation = (jurisdiction: string, answers: Answers) => {
  const isUltimateParent = answers.parent_status === 'yes' && answers.subsidiary_status === 'no';
  let explanation = 'CSDDD assessment: ';
  
  // Individual thresholds analysis
  if (jurisdiction === 'eu') {
    const empLabel = getEmployeeLabel(answers.employees_individual);
    const turnoverLabel = getTurnoverLabel(answers.turnover_individual);
    const meetsEmp = ['1000_2999', '3000_plus'].includes(answers.employees_individual);
    const meetsTurnover = ['450_900m', '900m_plus'].includes(answers.turnover_individual);
    
    explanation += `Individual thresholds - employees: ${empLabel} (need 1,000+), global turnover: ${turnoverLabel} (need €450M+)`;
    
    if (meetsEmp && meetsTurnover) {
      explanation += ' - thresholds met but ';
      if (answers.consecutive_years_csddd === 'no') {
        explanation += 'consecutive years requirement not satisfied;';
      } else if (answers.consecutive_years_csddd === 'uncertain') {
        explanation += 'consecutive years requirement uncertain;';
      } else {
        explanation += 'consecutive years not verified;';
      }
    } else {
      explanation += ' - individual thresholds not met;';
    }
  } else {
    // Non-EU
    const turnoverLabel = getTurnoverLabel(answers.turnover_individual);
    const meetsTurnover = ['450_900m', '900m_plus'].includes(answers.turnover_individual);
    
    explanation += `Individual thresholds - EU turnover: ${turnoverLabel} (need €450M+)`;
    
    if (meetsTurnover) {
      explanation += ' - threshold met but ';
      if (answers.consecutive_years_csddd === 'no') {
        explanation += 'consecutive years requirement not satisfied;';
      } else if (answers.consecutive_years_csddd === 'uncertain') {
        explanation += 'consecutive years requirement uncertain;';
      } else {
        explanation += 'consecutive years not verified;';
      }
    } else {
      explanation += ' - individual threshold not met;';
    }
  }
  
  // Group status analysis
  if (isUltimateParent) {
    explanation += ' Group status: ultimate parent';
    if (jurisdiction === 'eu') {
      const empLabel = getEmployeeLabel(answers.employees_consolidated);
      const turnoverLabel = getTurnoverLabel(answers.turnover_consolidated);
      const meetsGroupEmp = ['1000_2999', '3000_plus'].includes(answers.employees_consolidated);
      const meetsGroupTurnover = ['450_900m', '900m_plus'].includes(answers.turnover_consolidated);
      
      explanation += ` - consolidated employees: ${empLabel} (need 1,000+), consolidated global turnover: ${turnoverLabel} (need €450M+)`;
      
      if (meetsGroupEmp && meetsGroupTurnover) {
        explanation += ' - group thresholds met but consecutive years requirement issue;';
      } else {
        explanation += ' - group thresholds not met;';
      }
    } else {
      const turnoverLabel = getTurnoverLabel(answers.turnover_consolidated);
      const meetsGroupTurnover = ['450_900m', '900m_plus'].includes(answers.turnover_consolidated);
      
      explanation += ` - consolidated EU turnover: ${turnoverLabel} (need €450M+)`;
      
      if (meetsGroupTurnover) {
        explanation += ' - group threshold met but consecutive years requirement issue;';
      } else {
        explanation += ' - group threshold not met;';
      }
    }
  } else if (answers.parent_status === 'yes') {
    explanation += ' Group status: parent but not ultimate parent;';
  } else {
    explanation += ' Group status: not a parent company;';
  }
  
  // Franchising analysis
  if (answers.has_franchising_licensing === 'yes') {
    if (answers.franchising_licensing === 'yes_meets_criteria') {
      const turnoverThreshold = jurisdiction === 'eu' ? '€80M+ global' : '€80M+ EU';
      const royaltyThreshold = jurisdiction === 'eu' ? '€22.5M+' : '€22.5M+ EU';
      const meetsTurnoverForFranchising = ['80_150m', '150_450m', '450_900m', '900m_plus'].includes(answers.turnover_individual);
      const meetsRoyalties = jurisdiction === 'eu' ? 
        answers.franchise_royalties === 'yes' : 
        answers.franchise_eu_royalties === 'yes';
      
      explanation += ` Franchising: qualifying agreements exist, turnover ${meetsTurnoverForFranchising ? 'meets' : 'below'} ${turnoverThreshold}, royalties ${meetsRoyalties ? 'meet' : 'below'} ${royaltyThreshold}.`;
    } else {
      explanation += ' Franchising: agreements exist but do not meet CSDDD criteria.';
    }
  } else {
    explanation += ' Franchising: no qualifying agreements.';
  }
  
  return {
    inScope: false,
    reason: explanation,
    timeline: '',
    wave: null
  };
};

// Assessment scope functions
export const assessCSRDScope = (answers: Answers) => {
  const isLargeUndertaking = checkLargeUndertaking(answers);
  const isListedSME = checkListedSME(answers);
  const isParentOfLargeGroup = checkParentOfLargeGroup(answers);
  const isPIE = answers.listing_status === 'listed_eu' || answers.public_interest === 'yes';
  const hasOver500 = ['500_999', '1000_2999', '3000_plus'].includes(answers.employees_individual);
  const hasOver500Consolidated = ['500_999', '1000_2999', '3000_plus'].includes(answers.employees_consolidated);
  const isListed = answers.listing_status === 'listed_eu';

  // Following EC Decision Matrix structure
  
  // Branch 1: EU companies OR non-EU companies with EU securities trading
  const treatAsEUEntity = answers.jurisdiction === 'eu' || 
                         (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
  
  if (treatAsEUEntity) {
    // For non-EU companies with EU securities, they are automatically PIE under EU law
    const effectivelyPIE = isPIE || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
    const effectivelyListed = isListed || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
    
    // 1.1 Parent of large group?
    if (isParentOfLargeGroup) {
      if (effectivelyPIE && hasOver500Consolidated) {
        const hasEUSecurities = effectivelyListed || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
        const legalBasis = hasEUSecurities 
          ? 'Article 29a Accounting Directive + Article 4(5) Transparency Directive'
          : 'Article 29a Accounting Directive';
          
        return {
          inScope: true,
          wave: 1,
          timeline: 'Wave 1: Reporting started in 2025 for FY 2024',
          reason: answers.jurisdiction === 'non_eu' 
            ? 'Non-EU parent of large group with securities on EU regulated market and >500 employees (consolidated).'
            : 'Parent of large group that is PIE with >500 employees (consolidated).',
          reportingType: 'consolidated',
          automaticExemptions: ['individual_reporting'],
          possibleExemptions: effectivelyListed ? [] : ['subsidiary_exemption_29a8'],
          legalBasis
        };
      } else {
        const hasEUSecurities = effectivelyListed || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
        const legalBasis = hasEUSecurities 
          ? 'Article 29a Accounting Directive + Article 4(5) Transparency Directive'
          : 'Article 29a Accounting Directive';
          
        return {
          inScope: true,
          wave: 2,
          timeline: 'Wave 2: Reporting starts in 2028 for FY starting ≥1 January 2027',
          reason: answers.jurisdiction === 'non_eu' 
            ? 'Non-EU parent of large group with securities on EU regulated market.'
            : 'Parent of large group.',
          reportingType: 'consolidated',
          automaticExemptions: ['individual_reporting'],
          possibleExemptions: effectivelyListed ? [] : ['subsidiary_exemption_29a8'],
          legalBasis
        };
      }
    }
    
    // 1.2 Large undertaking?
    else if (isLargeUndertaking) {
      // Check for specialized financial entity timing
      const isSpecializedFinancial = answers.financial_type === 'snci' || answers.financial_type === 'captive_insurance';
      
      // Individual specialized financial entities ALWAYS get Wave 3 (FY 2028)
      if (isSpecializedFinancial) {
        const hasEUSecurities = effectivelyListed || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
        const legalBasis = hasEUSecurities 
          ? 'Article 19a Accounting Directive + Article 4(5) Transparency Directive'
          : 'Article 19a Accounting Directive';
          
        return {
          inScope: true,
          wave: 3,
          timeline: 'Wave 3: Reporting starts in 2029 for FY starting ≥1 January 2028',
          reason: answers.jurisdiction === 'non_eu' 
            ? `Non-EU large ${answers.financial_type === 'snci' ? 'small and non-complex institution' : 'captive insurance undertaking'} with securities on EU regulated market.`
            : `Large ${answers.financial_type === 'snci' ? 'small and non-complex institution' : 'captive insurance undertaking'}.`,
          reportingType: 'individual',
          automaticExemptions: [],
          possibleExemptions: effectivelyListed ? [] : ['subsidiary_exemption_19a9'],
          specializedTiming: true,
          nfrdTransition: (effectivelyPIE && hasOver500) ? true : false,
          legalBasis
        };
      }
      
      // Regular large undertakings follow standard timing
      if (effectivelyPIE && hasOver500) {
        const hasEUSecurities = effectivelyListed || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
        const legalBasis = hasEUSecurities 
          ? 'Article 19a Accounting Directive + Article 4(5) Transparency Directive'
          : 'Article 19a Accounting Directive';
          
        return {
          inScope: true,
          wave: 1,
          timeline: 'Wave 1: Reporting started in 2025 for FY 2024',
          reason: answers.jurisdiction === 'non_eu' 
            ? 'Non-EU large undertaking with securities on EU regulated market and >500 employees.'
            : 'Large undertaking that is PIE with >500 employees.',
          reportingType: 'individual',
          automaticExemptions: [],
          possibleExemptions: effectivelyListed ? [] : ['subsidiary_exemption_19a9'],
          legalBasis
        };
      } else {
        const hasEUSecurities = effectivelyListed || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
        const legalBasis = hasEUSecurities 
          ? 'Article 19a Accounting Directive + Article 4(5) Transparency Directive'
          : 'Article 19a Accounting Directive';
          
        return {
          inScope: true,
          wave: 2,
          timeline: 'Wave 2: Reporting starts in 2028 for FY starting ≥1 January 2027',
          reason: answers.jurisdiction === 'non_eu' 
            ? 'Non-EU large undertaking with securities on EU regulated market.'
            : 'Large undertaking.',
          reportingType: 'individual',
          automaticExemptions: [],
          possibleExemptions: effectivelyListed ? [] : ['subsidiary_exemption_19a9'],
          legalBasis
        };
      }
    }
    
    // 1.3 Listed SME or specialized entity that is listed SME?
    else if (isListedSME || 
             (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes' && !isLargeUndertaking && !['under_10'].includes(answers.employees_individual))) {
      // Check for specialized financial entity
      const isSpecializedFinancial = answers.financial_type === 'snci' || answers.financial_type === 'captive_insurance';
      const hasEUSecurities = effectivelyListed || (answers.jurisdiction === 'non_eu' && answers.eu_securities_trading === 'yes');
      const legalBasis = hasEUSecurities 
        ? 'Article 19a Accounting Directive + Article 4(5) Transparency Directive'
        : 'Article 19a Accounting Directive';
      
      return {
        inScope: true,
        wave: 3,
        timeline: 'Wave 3: Reporting starts in 2029 for FY starting ≥1 January 2028',
        reason: answers.jurisdiction === 'non_eu' 
          ? `Non-EU SME (excluding micro-undertakings) with securities admitted to trading on EU regulated market${isSpecializedFinancial ? ` (${answers.financial_type === 'snci' ? 'small and non-complex institution' : 'captive insurance undertaking'})` : ''}.`
          : `SME with securities admitted to trading on EU regulated market${isSpecializedFinancial ? ` (${answers.financial_type === 'snci' ? 'small and non-complex institution' : 'captive insurance undertaking'})` : ''}.`,
        reportingType: 'individual',
        automaticExemptions: [],
        possibleExemptions: (isListedSME || answers.jurisdiction === 'non_eu') ? ['opt_out_fy2028_2029', 'subsidiary_exemption_19a9'] : ['subsidiary_exemption_19a9'],
        specializedTiming: isSpecializedFinancial,
        legalBasis
      };
    }
    
    // Not subject (micro-undertakings or other excluded categories)
    else {
      return generateDetailedCSRDExplanation(treatAsEUEntity, 'excluded', answers);
    }
  }
  
  // Branch 2: Non-EU companies without EU securities trading (Article 40a pathway)
  else if (answers.jurisdiction === 'non_eu') {
    if (isThirdCountryInScope(answers)) {
      let reason = 'Third-country undertaking (Article 40a): ';
      if (answers.eu_subsidiary_qualification === 'large_undertaking' || 
         answers.eu_subsidiary_qualification === 'listed_sme') {
        reason += 'EU turnover >€150M for two consecutive years and qualifying EU subsidiary.';
      } else {
        reason += 'EU turnover >€150M for two consecutive years and EU branch >€40M (no qualifying subsidiary).';
      }
      
      return {
        inScope: true,
        wave: 3,
        timeline: 'Wave 3: Reporting starts in 2029 for FY starting ≥1 January 2028',
        reason,
        reportingType: 'third_country_group_level',
        automaticExemptions: [],
        possibleExemptions: ['third_country_consolidated_alternative'],
        legalBasis: 'Article 40a Accounting Directive'
      };
    } else {
      return generateDetailedCSRDExplanation(false, 'third_country', answers);
    }
  }
  
  return generateDetailedCSRDExplanation(false, 'unknown', answers);
};

export const assessCSDDD = (answers: Answers) => {
  // Following CSDDD Decision Matrix structure exactly
  
  const isUltimateParent = answers.parent_status === 'yes' && answers.subsidiary_status === 'no';
  
  if (answers.jurisdiction === 'eu') {
    // Branch 1: EU companies
    
    // 1.1 Individual company thresholds (last 2 FYs): >1,000 employees AND >€450M global turnover
    if (checkCSDDDIndividualThresholds(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('individual_eu_company', answers);
    }
    
    // 1.2 Ultimate parent of group meeting thresholds?
    if (isUltimateParent && checkCSDDDGroupThresholds(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('ultimate_parent_eu_group', answers);
    }
    
    // 1.3 Individual franchising thresholds: €22.5M royalties AND €80M global turnover
    if (checkCSDDDIndividualFranchising(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('individual_eu_franchising', answers);
    }
    
    // 1.4 Ultimate parent of group with franchising thresholds?
    if (isUltimateParent && checkCSDDDGroupFranchising(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('ultimate_parent_eu_franchising', answers);
    }
    
    // Not in scope - provide detailed explanation
    return generateDetailedCSDDDExplanation('eu', answers);
  } 
  
  else if (answers.jurisdiction === 'non_eu') {
    // Branch 2: Non-EU companies
    
    // 2.1 Individual company: >€450M EU turnover (2 FYs preceding last FY)
    if (checkCSDDDNonEUIndividualThresholds(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('individual_non_eu_company', answers);
    }
    
    // 2.2 Ultimate parent of group meeting EU thresholds?
    if (isUltimateParent && checkCSDDDNonEUGroupThresholds(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('ultimate_parent_non_eu_group', answers);
    }
    
    // 2.3 Individual EU franchising: €22.5M EU royalties AND €80M EU turnover
    if (checkCSDDDNonEUIndividualFranchising(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('individual_non_eu_franchising', answers);
    }
    
    // 2.4 Ultimate parent of group with EU franchising?
    if (isUltimateParent && checkCSDDDNonEUGroupFranchising(answers) && answers.consecutive_years_csddd === 'yes') {
      return assessCSDDDTimeline('ultimate_parent_non_eu_franchising', answers);
    }
    
    // Not in scope - provide detailed explanation
    return generateDetailedCSDDDExplanation('non_eu', answers);
  }
  
  return {
    inScope: false,
    reason: 'Jurisdiction not determined for CSDDD assessment.',
    timeline: '',
    wave: null
  };
};