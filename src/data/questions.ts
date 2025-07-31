import { 
  Answers, 
  checkCSDDDIndividualThresholds,
  checkCSDDDGroupThresholds,
  checkCSDDDFranchisingThresholds,
  assessCSDDD,
  assessCSRDScope
} from '../utils/helpers';

export interface Question {
  key: string;
  label: string | ((answers: Answers) => string);
  type: string;
  options: Array<{ value: string; label: string }>;
  required: boolean;
  condition?: (answers: Answers) => boolean;
  help?: string | ((answers: Answers) => string);
}

export interface QuestionSection {
  id: string;
  title: string;
  show?: (answers: Answers) => boolean;
  questions: Question[];
}

// Helper functions for temporal verification
const needsTemporalVerification = (answers: Answers) => {
  return needsCSDDDTemporal(answers) || needsArticle40aTemporal(answers);
};

const needsCSDDDTemporal = (answers: Answers) => {
  const meetsIndividualThresholds = checkCSDDDIndividualThresholds(answers);
  const isUltimateParent = answers.parent_status === 'yes' && answers.subsidiary_status === 'no';
  const meetsGroupThresholds = isUltimateParent && checkCSDDDGroupThresholds(answers);
  const meetsFranchisingThresholds = checkCSDDDFranchisingThresholds(answers);
  
  return meetsIndividualThresholds || meetsGroupThresholds || meetsFranchisingThresholds;
};

const needsArticle40aTemporal = (answers: Answers) => {
  // Article 40a temporal verification is handled by eu_turnover_threshold question
  // No separate temporal question needed since "both_over_150m" already captures consecutive years
  return false;
};

export const questions: QuestionSection[] = [
  {
    id: 'entity_basics',
    title: 'Company Classification',
    questions: [
      {
        key: 'jurisdiction',
        label: 'Where is your company incorporated?',
        type: 'select',
        options: [
          { value: 'eu', label: 'EU Member State' },
          { value: 'non_eu', label: 'Non-EU Country' }
        ],
        required: true,
        help: 'A company is considered to be "EU" if it is governed by or formed in accordance with the legislation of a Member State, typically the country where it is incorporated or headquartered. A "non-EU company" is governed by or formed in accordance with the legislation of a third country, but may still be subject to EU law if it has significant operations within the EU.'
      },
      {
        key: 'undertaking_type',
        label: 'Is your company a financial or non-financial undertaking?',
        type: 'select',
        options: [
          { value: 'financial', label: 'Financial undertaking (bank, insurance company, investment firm, asset manager)' },
          { value: 'non_financial', label: 'Non-financial undertaking (all other commercial entities)' }
        ],
        required: true,
        help: 'Under EU law (Article 1(8) of Delegated Regulation (EU) 2021/2178), financial undertakings are specifically defined as credit institutions, insurance/reinsurance undertakings, investment firms, and asset managers. All other companies are non-financial undertakings, also referred to as real economy companies (directly producing goods or providing services).'
      },
      {
        key: 'non_financial_legal_form',
        label: 'Legal form of your non-financial undertaking',
        type: 'select',
        options: [
          { value: 'limited_company', label: 'Limited Liability Company' },
          { value: 'public_company', label: 'Public Company' },
          { value: 'partnership_cooperative', label: 'Partnership, cooperative, or similar entity (listed in Annexes I and II of the Accounting Directive)' },
          { value: 'other_entity', label: 'Other entity type (not listed in Annexes I and II of the Accounting Directive)' }
        ],
        required: true,
        condition: (answers: Answers) => answers.undertaking_type === 'non_financial',
        help: 'The EU Accounting Directive defines specific entity types by Member State that qualify as "undertakings" in Article 1(1) and Annexes I and II. Examples include: Limited Liability Company (Ltd, GmbH, ApS, AB, etc.), Public Company (PLC, AG, SA, SpA, etc.), and Partnership, cooperative, or similar entity (OHG, société en nom collectif, eG, SCOP, etc.). For the full legal text, see Article 1(1) and Annexes 1 and 2 of the Accounting Directive: https://eur-lex.europa.eu/eli/dir/2013/34/oj/eng'
      },
      {
        key: 'annex_ii_member_structure',
        label: 'Do all members of your partnership/cooperative who would otherwise have unlimited liability actually have limited liability because they are themselves limited liability companies, public companies, or comparable entities?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - all unlimited liability members are limited liability entities' },
          { value: 'no', label: 'No - some unlimited liability members are individuals or other unlimited liability entities' }
        ],
        required: true,
        condition: (answers: Answers) => answers.undertaking_type === 'non_financial' && answers.non_financial_legal_form === 'partnership_cooperative',
        help: 'This distinction is important for CSRD applicability. Under Article 1(1)(b) of the Accounting Directive, partnerships and cooperatives are only covered by CSRD if all members with unlimited liability actually have limited liability through being limited liability companies, public companies, or comparable entities.'
      },
      {
        key: 'financial_type',
        label: 'What type of financial institution are you?',
        type: 'select',
        options: [
          { value: 'credit_institution', label: 'Credit Institution/Bank' },
          { value: 'snci', label: 'Small and Non-Complex Institution' },
          { value: 'insurance_company', label: 'Insurance Company' },
          { value: 'captive_insurance', label: 'Captive Insurance/Reinsurance' },
          { value: 'investment_firm', label: 'Investment Firm' },
          { value: 'asset_manager', label: 'Asset Manager' }
        ],
        required: true,
        condition: (answers: Answers) => answers.undertaking_type === 'financial',
        help: 'Different types of financial institutions may have different reporting timelines and requirements under EU sustainability laws.'
      },
      {
        key: 'listing_status',
        label: 'Is your company listed on a regulated market?',
        type: 'select',
        options: [
          { value: 'listed_eu', label: 'Listed on EU regulated market' },
          { value: 'listed_non_eu', label: 'Listed on non-EU regulated market only' },
          { value: 'not_listed', label: 'Not listed' }
        ],
        required: true,
        help: 'A regulated market is an official stock exchange that is recognised and supervised by government authorities. Under EU law (Article 2(1)(a) of Directive 2013/34/EU), companies listed on any EU Member State regulated market are automatically classified as Public Interest Entities, which affects sustainability reporting timelines.'
      },
      {
        key: 'public_interest',
        label: 'Is your company a Public Interest Entity under EU law?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes (bank, insurance company, or other designated entity)' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' }
        ],
        required: true,
        condition: (answers: Answers) => answers.jurisdiction === 'eu' && answers.listing_status !== 'listed_eu',
        help: 'Under Article 2(1) of Directive 2013/34/EU, Public Interest Entities are: (a) companies listed on EU regulated markets, (b) credit institutions, (c) insurance undertakings, or (d) companies designated by Member States as PIEs due to public relevance. Since you indicated you are not listed on an EU regulated market, this question asks whether you fall into categories (b), (c), or (d).'
      }
    ]
  },
  {
    id: 'group_structure',
    title: 'Group Structure',
    questions: [
      {
        key: 'parent_status',
        label: 'Is your company a parent undertaking that controls other entities?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - we have subsidiaries' },
          { value: 'no', label: 'No - we do not control other entities' }
        ],
        required: true,
        help: 'Under EU law (Article 22 of Directive 2013/34/EU), you are a parent undertaking if you: (a) hold more than 50% of voting rights in another entity, (b) have the right to appoint/remove the majority of board members, (c) have controlling influence through agreements, or (d) exercise dominant influence through ownership. In simple terms: do you own or control other companies/subsidiaries?'
      },
      {
        key: 'subsidiary_status',
        label: 'Is your company a subsidiary of another entity?',
        type: 'select',
        options: [
          { value: 'yes_eu', label: 'Yes - EU parent company' },
          { value: 'yes_non_eu', label: 'Yes - Non-EU parent company' },
          { value: 'no', label: 'No - we are not controlled by another entity' }
        ],
        required: true,
        help: 'Under EU law, you are a subsidiary if another entity (parent company) controls you through voting rights, board appointment rights, or other controlling mechanisms. This matters because subsidiaries may be exempt from certain reporting requirements if the parent company already complies.'
      }
    ]
  },
  {
    id: 'size_individual',
    title: 'Company Size (Individual Level)',
    questions: [
      {
        key: 'employees_individual',
        label: 'Average number of employees in your company (most recent financial year)',
        type: 'select',
        options: [
          { value: 'under_10', label: 'Under 10 (Micro)' },
          { value: '10_49', label: '10-49 (Small)' },
          { value: '50_249', label: '50-249 (Medium)' },
          { value: '250_499', label: '250-499' },
          { value: '500_999', label: '500-999' },
          { value: '1000_2999', label: '1,000-2,999' },
          { value: '3000_plus', label: '3,000+' }
        ],
        required: true,
        help: 'Average number of employees means the average number of persons employed by your undertaking during the financial year. Different calculation rules may apply under CSDDD and CSRD: CSRD principally draws on Member State rules, whereas CSDDD provides harmonised clarifications for specific categories of employees in Article 2(4) CSDDD. In case of doubt, consider the specific rules that are relevant for your company.'
      },
      {
        key: 'turnover_individual',
        label: (answers: Answers) => answers.jurisdiction === 'non_eu' ? 'Annual net turnover generated by your company in the EU (most recent financial year)' : 'Annual net turnover of your company worldwide (most recent financial year)',
        type: 'select',
        options: [
          { value: 'under_2m', label: 'Under €2 million' },
          { value: '2_10m', label: '€2-10 million' },
          { value: '10_50m', label: '€10-50 million' },
          { value: '50_80m', label: '€50-80 million' },
          { value: '80_150m', label: '€80-150 million' },
          { value: '150_450m', label: '€150-450 million' },
          { value: '450_900m', label: '€450-900 million' },
          { value: '900m_plus', label: '€900 million+' }
        ],
        required: true,
        help: (answers: Answers) => `Under EU law (Article 2(5) of Directive 2013/34/EU), "net turnover" means the amounts derived from the sale of products and provision of services, after deducting sales rebates, VAT and other taxes directly linked to turnover. Note: Special definitions apply for insurance undertakings, credit institutions, and certain third-country undertakings—consult sector-specific regulations if applicable. ${answers.jurisdiction === 'eu' ? 'For EU companies, global turnover determines threshold compliance.' : 'For non-EU companies, only EU-generated turnover is relevant for EU law applicability.'}`
      },
      {
        key: 'balance_sheet_individual',
        label: (answers: Answers) => answers.jurisdiction === 'non_eu' ? 'Balance sheet total attributable to EU operations (most recent financial year)' : 'Balance sheet total of your company (most recent financial year)',
        type: 'select',
        options: [
          { value: 'under_2m', label: 'Under €2 million' },
          { value: '2_5m', label: '€2-5 million' },
          { value: '5_25m', label: '€5-25 million' },
          { value: '25m_plus', label: '€25 million+' }
        ],
        required: true,
        help: 'Balance sheet total means the total value of the main asset categories (subscribed capital unpaid, formation expenses, fixed assets, current assets, and prepayments and accrued income) as defined in Article 3(11) of the EU Accounting Directive and specified in the standard balance sheet layouts.'
      }
    ]
  },
  {
    id: 'size_consolidated',
    title: 'Group Size (Consolidated Level)',
    show: (answers: Answers) => answers.parent_status === 'yes',
    questions: [
      {
        key: 'employees_consolidated',
        label: 'Average number of employees in your group (consolidated basis)',
        type: 'select',
        options: [
          { value: 'under_250', label: 'Under 250' },
          { value: '250_499', label: '250-499' },
          { value: '500_999', label: '500-999' },
          { value: '1000_2999', label: '1,000-2,999' },
          { value: '3000_plus', label: '3,000+' }
        ],
        required: true,
        help: 'Average number of employees means the average number of persons employed by your undertaking during the financial year. Different calculation rules may apply under CSDDD and CSRD: CSRD principally draws on Member State rules, whereas CSDDD provides harmonised clarifications for specific categories of employees in Article 2(4) CSDDD. In case of doubt, consider the specific rules that are relevant for your company. Consolidated employee count includes all employees across all subsidiaries and entities within your group.'
      },
      {
        key: 'turnover_consolidated',
        label: (answers: Answers) => answers.jurisdiction === 'non_eu' ? 'Annual net turnover of your group in the EU (consolidated basis)' : 'Annual net turnover of your group worldwide (consolidated basis)',
        type: 'select',
        options: [
          { value: 'under_50m', label: 'Under €50 million' },
          { value: '50_450m', label: '€50-450 million' },
          { value: '450_900m', label: '€450-900 million' },
          { value: '900m_plus', label: '€900 million+' }
        ],
        required: true,
        help: (answers: Answers) => `Consolidated group turnover includes revenue from all entities within your group. Note: Special definitions apply for insurance undertakings, credit institutions, and certain third-country undertakings—consult sector-specific regulations if applicable. ${answers.jurisdiction === 'eu' ? 'For EU companies, global consolidated turnover applies.' : 'For non-EU companies, only EU-generated consolidated turnover is relevant.'}`
      },
      {
        key: 'balance_sheet_consolidated',
        label: (answers: Answers) => answers.jurisdiction === 'non_eu' ? 'Balance sheet total of your group attributable to EU operations (consolidated basis)' : 'Balance sheet total of your group (consolidated basis)',
        type: 'select',
        options: [
          { value: 'under_25m', label: 'Under €25 million' },
          { value: '25m_plus', label: '€25 million+' }
        ],
        required: true,
        help: 'Consolidated balance sheet total means the total value of the main asset categories (subscribed capital unpaid, formation expenses, fixed assets, current assets, and prepayments and accrued income) across all entities within your group, as defined in Article 3(11) of the EU Accounting Directive.'
      }
    ]
  },
  {
    id: 'international_operations',
    title: 'International Operations',
    questions: [
      {
        key: 'multinational_enterprise',
        label: 'Does your company qualify as a multinational enterprise based on its structure or activities?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - we have international structure or activities' },
          { value: 'no', label: 'No - we operate domestically only' }
        ],
        required: true,
        help: 'Under the OECD Guidelines for Multinational Enterprises on Responsible Business Conduct, you qualify as a multinational enterprise if your company has international structure or activities, such as: entities established in multiple countries that coordinate operations, cross-border operational coordination (shared management, technology, or business strategies), significant international suppliers/customers, or contractual arrangements like franchising, licensing, joint ventures, or distribution agreements across countries. Examples: A German company with a French subsidiary; a UK firm sourcing from Asian suppliers; an Italian company licensing technology internationally.'
      },
      {
        key: 'oecd_adherent_countries',
        label: 'Do you operate in or from countries that adhere to the OECD Guidelines for Multinational Enterprises on Responsible Business Conduct?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - we operate in/from adherent countries' },
          { value: 'no', label: 'No - we do not operate in/from adherent countries' }
        ],
        required: true,
        condition: (answers: Answers) => answers.multinational_enterprise === 'yes',
        help: 'Countries that adhere to the OECD Guidelines for Multinational Enterprises on Responsible Business Conduct include: Argentina, Australia, Austria, Belgium, Bulgaria, Brazil, Canada, Chile, Colombia, Costa Rica, Czech Republic, Croatia, Denmark, Egypt, Estonia, Finland, France, Germany, Greece, Hungary, Iceland, Ireland, Israel, Italy, Japan, Jordan, Kazakhstan, Korea, Latvia, Lithuania, Luxembourg, Mexico, Morocco, Netherlands, New Zealand, Norway, Peru, Poland, Portugal, Romania, Slovak Republic, Slovenia, Spain, Sweden, Switzerland, Tunisia, Türkiye, Ukraine, United Kingdom, United States, and Uruguay.'
      }
    ]
  },
  {
    id: 'non_eu_csrd_scope',
    title: 'CSRD Scope Assessment (Non-EU Companies)',
    show: (answers: Answers) => answers.jurisdiction === 'non_eu',
    questions: [
      {
        key: 'eu_securities_trading',
        label: 'Are your company\'s securities admitted to trading on any EU regulated market?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - admitted to trading on EU regulated market' },
          { value: 'no', label: 'No - not admitted to trading on EU regulated market' }
        ],
        required: true,
        help: 'Under CSRD Article 40a, third-country undertakings whose securities are admitted to trading on EU regulated markets are directly subject to CSRD requirements, regardless of other criteria. This includes stock exchanges in any EU Member State.'
      },
      {
        key: 'eu_turnover_threshold',
        label: 'What was your company\'s net turnover generated in the EU in each of the last two consecutive financial years?',
        type: 'select',
        options: [
          { value: 'both_over_150m', label: 'Both years: over €150 million' },
          { value: 'one_over_150m', label: 'One year over €150 million, one year under €150 million' },
          { value: 'both_under_150m', label: 'Both years: €150 million or under' }
        ],
        required: true,
        condition: (answers: Answers) => answers.eu_securities_trading === 'no',
        help: 'Under CSRD Article 40a, third-country undertakings must generate net turnover in the EU exceeding €150 million in each of the last two consecutive financial years to potentially fall within scope (in addition to having qualifying EU subsidiaries or branches).'
      },
      {
        key: 'eu_corporate_presence',
        label: 'What type of corporate presence does your company have in the EU?',
        type: 'select',
        options: [
          { value: 'subsidiary_only', label: 'EU subsidiary only' },
          { value: 'branch_only', label: 'EU branch only' },
          { value: 'both_subsidiary_branch', label: 'Both EU subsidiary and branch' },
          { value: 'no_presence', label: 'No EU corporate presence' }
        ],
        required: true,
        condition: (answers: Answers) => answers.eu_securities_trading === 'no' && answers.eu_turnover_threshold === 'both_over_150m',
        help: 'Third-country undertakings with EU turnover >€150M must have either qualifying EU subsidiaries or branches to fall within CSRD scope.'
      },
      {
        key: 'eu_subsidiary_qualification',
        label: 'Does your company have any EU subsidiary that qualifies under Article 40a?',
        type: 'select',
        options: [
          { value: 'large_undertaking', label: 'Yes - Large undertaking (meets 2+ criteria: 250+ employees, €50M+ turnover, €25M+ balance sheet)' },
          { value: 'listed_sme', label: 'Yes - Listed SME (securities admitted to trading on EU regulated market, not micro-undertaking)' },
          { value: 'other_sme', label: 'No - Only other SME (not listed, not micro-undertaking)' },
          { value: 'micro_undertaking', label: 'No - Only micro-undertaking' },
          { value: 'no_subsidiary', label: 'No - No EU subsidiary' }
        ],
        required: true,
        condition: (answers: Answers) => answers.eu_securities_trading === 'no' && 
                               answers.eu_turnover_threshold === 'both_over_150m' && 
                               (answers.eu_corporate_presence === 'subsidiary_only' || 
                                answers.eu_corporate_presence === 'both_subsidiary_branch'),
        help: 'Under CSRD Article 40a, qualifying EU subsidiaries must be either: (1) large undertakings, or (2) small and medium-sized undertakings (excluding micro-undertakings) that are public-interest entities as defined in point (a) of Article 2(1) - meaning their securities are admitted to trading on EU regulated markets. If you have multiple EU subsidiaries, answer "Yes" if ANY subsidiary qualifies.'
      },
      {
        key: 'eu_branch_turnover',
        label: 'What is your EU branch\'s net turnover generated in the EU in the preceding financial year?',
        type: 'select',
        options: [
          { value: 'over_40m', label: 'Over €40 million' },
          { value: 'under_40m', label: '€40 million or under' }
        ],
        required: true,
        condition: (answers: Answers) => answers.eu_securities_trading === 'no' && 
                               answers.eu_turnover_threshold === 'both_over_150m' && 
                               (answers.eu_corporate_presence === 'branch_only' || 
                                (answers.eu_corporate_presence === 'both_subsidiary_branch' && 
                                 (answers.eu_subsidiary_qualification === 'other_sme' || 
                                  answers.eu_subsidiary_qualification === 'micro_undertaking' || 
                                  answers.eu_subsidiary_qualification === 'no_subsidiary'))),
        help: 'Under CSRD Article 40a, EU branches are only relevant when there is no qualifying EU subsidiary. Branches must generate net turnover in the EU exceeding €40 million in the preceding financial year. This question only appears if you have no qualifying subsidiary.'
      }
    ]
  },
  {
    id: 'business_model',
    title: 'Business Model Specifics',
    questions: [
      {
        key: 'has_franchising_licensing',
        label: 'Does your company have any franchising or licensing agreements?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - we have franchising or licensing agreements' },
          { value: 'no', label: 'No - we do not have franchising or licensing agreements' }
        ],
        required: true,
        help: 'This includes any agreements where you grant rights to use your brand, business methods, technology, or intellectual property to other parties, or where you operate under franchise/licensing arrangements from others.'
      },
      {
        key: 'franchising_licensing',
        label: 'Do your franchising or licensing agreements in the EU meet ALL of the following CSDDD criteria: (a) agreements with independent third parties, (b) in return for royalties, (c) ensuring common identity and business concept, (d) requiring uniform business methods?',
        type: 'select',
        options: [
          { value: 'yes_meets_criteria', label: 'Yes - meets all CSDDD criteria' },
          { value: 'yes_not_criteria', label: 'Yes - but does not meet all CSDDD criteria' },
          { value: 'no', label: 'No EU franchising/licensing agreements' }
        ],
        required: true,
        condition: (answers: Answers) => answers.has_franchising_licensing === 'yes',
        help: 'Under the CSDDD (Article 2(1)(c) and (2)(c)), relevant franchising/licensing agreements must be with independent third parties, in return for royalties, ensuring common identity and business concept, and requiring uniform business methods. The CSDDD covers such relationships because they create value chain connections that may involve human rights or environmental risks.'
      },
      {
        key: 'franchise_royalties',
        label: 'Do these franchising/licensing agreements generate royalties exceeding €22.5 million in the last financial year for which annual financial statements have been or should have been adopted?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - €22.5 million+' },
          { value: 'no', label: 'No - under €22.5 million' }
        ],
        required: true,
        condition: (answers: Answers) => answers.has_franchising_licensing === 'yes' && answers.franchising_licensing === 'yes_meets_criteria' && answers.jurisdiction === 'eu',
        help: 'For EU companies, CSDDD requires royalties to exceed €22.5 million in the last financial year for which annual financial statements have been or should have been adopted.'
      },
      {
        key: 'franchise_eu_royalties',
        label: 'Do these EU franchising/licensing agreements generate royalties exceeding €22.5 million in the Union in the financial year preceding the last financial year?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - €22.5 million+ EU royalties' },
          { value: 'no', label: 'No - under €22.5 million EU royalties' }
        ],
        required: true,
        condition: (answers: Answers) => answers.has_franchising_licensing === 'yes' && answers.franchising_licensing === 'yes_meets_criteria' && answers.jurisdiction === 'non_eu',
        help: 'For non-EU companies, CSDDD requires royalties exceeding €22.5 million in the Union in the financial year preceding the last financial year.'
      }
    ]
  },
  {
    id: 'indirect_applicability',
    title: 'Indirect Impact Assessment',
    show: (answers: Answers) => {
      // Get CSDDD and CSRD scope assessment to determine if either is directly in scope
      const csdddResult = assessCSDDD(answers);
      const csrdResult = assessCSRDScope(answers);
      return !csdddResult.inScope || !csrdResult.inScope;
    },
    questions: [
      {
        key: 'indirect_business_relationships',
        label: 'Do you have significant business relationships (as supplier, customer, partner, or investee) with large companies or multinational enterprises that may be subject to EU sustainability frameworks?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - we have relationships with large companies subject to EU frameworks' },
          { value: 'no', label: 'No - we do not have such relationships' },
          { value: 'unsure', label: 'Unsure - requires further analysis' }
        ],
        required: true,
        help: 'Based on your answers given, your company is likely not in scope of the CSRD and CSDDD. However, even where your company is not in scope, you may be indirectly affected through requirements that demand engagement with business partners. Large companies subject to these frameworks must request sustainability information, due diligence documentation, or compliance commitments from their suppliers, customers, and partners as part of their own compliance. This includes relationships with: companies subject to CSDDD (1,000+ employees and €450M+ turnover, ultimate parent companies whose groups meet these thresholds at the consolidated level, or companies with qualifying franchising/licensing agreements generating €22.5M+ royalties), companies subject to CSRD (large EU companies meeting 2+ criteria: 250+ employees, €50M+ turnover, €25M+ balance sheet), major multinational corporations, listed companies, or companies in specifically regulated industries.'
      }
    ]
  },
  {
    id: 'temporal_verification',
    title: 'Temporal Requirements Verification',
    show: (answers: Answers) => needsTemporalVerification(answers),
    questions: [
      {
        key: 'consecutive_years_csddd',
        label: (answers: Answers) => {
          const isUltimateParent = answers.parent_status === 'yes' && answers.subsidiary_status === 'no';
          const hasIndividualThresholds = checkCSDDDIndividualThresholds(answers);
          const hasGroupThresholds = isUltimateParent && checkCSDDDGroupThresholds(answers);
          const hasFranchising = checkCSDDDFranchisingThresholds(answers);
          const isEU = answers.jurisdiction === 'eu';
          
          let thresholdText = 'Has your company met the following CSDDD thresholds for two consecutive financial years: ';
          
          if (hasIndividualThresholds) {
            thresholdText += `1,000+ employees AND €450M+ ${isEU ? 'global' : 'EU'} turnover (individual level)`;
          } else if (hasGroupThresholds) {
            thresholdText += `1,000+ employees AND €450M+ ${isEU ? 'global' : 'EU'} turnover (consolidated group level)`;
          } else if (hasFranchising) {
            thresholdText += `€22.5M+ ${isEU ? '' : 'EU '}royalties from qualifying franchising/licensing agreements AND €80M+ ${isEU ? 'global' : 'EU'} turnover`;
          }
          
          return thresholdText + '?';
        },
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - met these specific thresholds for two consecutive years' },
          { value: 'no', label: 'No - only met thresholds in one year or neither year' },
          { value: 'uncertain', label: 'Uncertain/requires further analysis' }
        ],
        required: true,
        condition: (answers: Answers) => needsCSDDDTemporal(answers),
        help: 'CSDDD obligations only begin after a company meets the specific size and turnover thresholds for two consecutive financial years. This "consecutive years" requirement prevents temporary business fluctuations (like one-time contracts, acquisitions, or seasonal spikes) from triggering permanent legal compliance obligations. The law recognizes that sustainability due diligence requirements should only apply to companies with sustained, demonstrable scale rather than temporary threshold breaches.'
      }
    ]
  },
  {
    id: 'timeline',
    title: 'Timeline Assessment',
    questions: [
      {
        key: 'future_thresholds',
        label: 'Based on projected growth, do you expect to meet higher thresholds in consecutive financial years?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes - significant growth expected' },
          { value: 'maybe', label: 'Possibly - moderate growth expected' },
          { value: 'no', label: 'No - stable size expected' }
        ],
        required: true,
        help: 'Many EU laws require companies to meet size thresholds for two consecutive financial years before obligations begin. This question helps assess whether you should prepare for future compliance even if not currently in scope.'
      },
      {
        key: 'growth_metrics',
        label: 'If growth is expected, which metrics will likely increase?',
        type: 'select',
        options: [
          { value: 'employees', label: 'Employee count' },
          { value: 'turnover', label: 'Turnover' },
          { value: 'balance_sheet', label: 'Balance sheet total' },
          { value: 'multiple', label: 'Multiple metrics' }
        ],
        required: true,
        condition: (answers: Answers) => answers.future_thresholds === 'yes' || answers.future_thresholds === 'maybe',
        help: 'Understanding which specific thresholds might be crossed helps determine when obligations might trigger and what preparation is needed.'
      }
    ]
  }
];