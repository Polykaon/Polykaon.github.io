import React from 'react';
import { FileText, Info } from 'lucide-react';
import { Answers } from '../utils/helpers';

interface AssessmentResult {
  inScope: boolean;
  reason: string;
  timeline?: string;
  wave?: number | null;
  reportingType?: string | null;
  automaticExemptions?: string[];
  possibleExemptions?: string[];
  legalBasis?: string | null;
  note?: string | null;
  nfrdTransition?: boolean;
  specializedTiming?: boolean;
  details?: any;
}

interface Assessment {
  ungps: AssessmentResult;
  oecd: AssessmentResult;
  csrd: AssessmentResult;
  taxonomy: AssessmentResult;
  csddd: AssessmentResult;
}

interface ReportViewerProps {
  assessment: Assessment;
  answers: Answers;
  expandedLaw: string | null;
  setExpandedLaw: (law: string | null) => void;
  restart: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  assessment,
  answers,
  expandedLaw,
  setExpandedLaw,
  restart,
}) => {
  // Function to convert assessment criteria text to structured format
  const formatAssessmentText = (text: string) => {
    // Always apply formatting for assessment texts
    if (text.includes('assessment')) {
      if (text.includes('OECD Guidelines assessment')) {
        return formatOECDAssessment(text);
      } else if (text.includes('CSRD assessment')) {
        return formatCSRDAssessment(text);
      } else if (text.includes('EU Taxonomy assessment')) {
        return formatTaxonomyAssessment(text);
      } else if (text.includes('CSDDD assessment')) {
        return formatCSDDDAssessment(text);
      }
    }
    
    // For other texts, return as-is
    return <span className="text-sm">{text}</span>;
  };

  const formatOECDAssessment = (text: string) => {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-800">OECD Guidelines Assessment</h4>
        <ul className="list-disc list-outside space-y-1 ml-6 pl-2 text-sm">
          {(() => {
            // Parse multinational enterprise status
            if (text.includes('operates domestically only')) {
              return (
                <>
                  <li>
                    <strong>Multinational Enterprise Status:</strong> Operates domestically only <span className="ml-2">✗</span>
                  </li>
                  <li className="font-medium">
                    <strong>Result:</strong> Not Applicable - Guidelines apply to multinational 
                    enterprises only
                  </li>
                </>
              );
            } else if (text.includes('operates only in non-adherent countries')) {
              return (
                <>
                  <li>
                    <strong>Multinational Enterprise Status:</strong> Yes, multinational enterprise <span className="ml-2">✓</span>
                  </li>
                  <li>
                    <strong>Adherent Countries Operation:</strong> Operates only in non-adherent 
                    countries <span className="ml-2">✗</span>
                  </li>
                  <li className="font-medium">
                    <strong>Result:</strong> Not Applicable - Guidelines apply to enterprises 
                    operating in or from adherent countries
                  </li>
                </>
              );
            } else if (text.includes('Yes') && text.includes('adherent countries')) {
              return (
                <>
                  <li>
                    <strong>Multinational Enterprise Status:</strong> Yes, multinational enterprise <span className="ml-2">✓</span>
                  </li>
                  <li>
                    <strong>Adherent Countries Operation:</strong> Operates in or from adherent 
                    countries <span className="ml-2">✓</span>
                  </li>
                  <li className="font-medium">
                    <strong>Result:</strong> Applicable - All criteria met
                  </li>
                </>
              );
            }
            
            // Default parsing
            return (
              <li className="font-medium">
                <strong>Assessment:</strong> {text.replace('OECD Guidelines assessment: ', '')}
              </li>
            );
          })()}
        </ul>
      </div>
    );
  };

  const formatCSRDAssessment = (text: string) => {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-800">CSRD Assessment</h4>
        <ul className="list-disc list-outside space-y-1 ml-6 pl-2 text-sm">
          {(() => {
            // Parse large undertaking criteria
            const criteriaMatch = text.match(/Large undertaking criteria \(need 2 of 3\)[^-]*- employees: ([^(]+)\(([^)]*)\), turnover: ([^(]+)\(([^)]*)\), balance sheet: ([^(]+)\(([^)]*)\)[^-]*- meets (\d+)\/3 criteria/);
            if (criteriaMatch) {
              const [, empValue, empStatus, turnoverValue, turnoverStatus, balanceValue, balanceStatus, metCriteria] = criteriaMatch;
              const isApplicable = parseInt(metCriteria) >= 2;
              
              return (
                <>
                  <li>
                    <strong>Employee Count:</strong> {empValue.trim()} (need 250+) <span className="ml-2">{empStatus.includes('✗') ? '✗' : '✓'}</span>
                  </li>
                  <li>
                    <strong>Annual Turnover:</strong> {turnoverValue.trim()} (need €50M+) <span className="ml-2">{turnoverStatus.includes('✗') ? '✗' : '✓'}</span>
                  </li>
                  <li>
                    <strong>Balance Sheet Total:</strong> {balanceValue.trim()} (need €25M+) <span className="ml-2">{balanceStatus.includes('✗') ? '✗' : '✓'}</span>
                  </li>
                  <li className="font-medium">
                    <strong>Result:</strong> Meets {metCriteria}/3 criteria (need 2/3) - 
                    {isApplicable ? 'Applicable ✓' : 'Not Applicable ✗'}
                  </li>
                </>
              );
            }
            
            // Parse Article 40a analysis for third-country companies
            if (text.includes('Article 40a analysis')) {
              const euSecuritiesMatch = text.match(/EU securities trading: (\w+)/);
              const euTurnoverMatch = text.match(/EU turnover: ([^;]+)(?:;|$)/);
              
              const items = [];
              
              if (euSecuritiesMatch) {
                const tradingStatus = euSecuritiesMatch[1];
                const isTrading = tradingStatus.toLowerCase() === 'yes';
                items.push(
                  <li key="securities">
                    <strong>EU Securities Trading:</strong> {tradingStatus} <span className="ml-2">{isTrading ? '✓' : '✗'}</span>
                  </li>
                );
              }
              
              if (euTurnoverMatch) {
                const turnoverInfo = euTurnoverMatch[1].trim();
                const meetsThreshold = turnoverInfo.includes('€150M') && !turnoverInfo.includes('Under');
                items.push(
                  <li key="turnover">
                    <strong>EU Turnover:</strong> {turnoverInfo} <span className="ml-2">{meetsThreshold ? '✓' : '✗'}</span>
                  </li>
                );
              }
              
              items.push(
                <li key="result" className="font-medium">
                  <strong>Result:</strong> Not Applicable - Article 40a thresholds not met 
                  <span className="ml-2">✗</span>
                </li>
              );
              
              return items;
            }
            
            // Parse other CSRD patterns
            if (text.includes('third-country')) {
              const isApplicable = text.includes('qualifying');
              return (
                <>
                  <li>
                    <strong>Third-Country Status:</strong> Non-EU company <span className="ml-2">✓</span>
                  </li>
                  <li>
                    <strong>EU Presence:</strong> {isApplicable ? 'Qualifying subsidiaries/branches' : 'No qualifying presence'} 
                    <span className="ml-2">{isApplicable ? '✓' : '✗'}</span>
                  </li>
                  <li className="font-medium">
                    <strong>Result:</strong> {isApplicable ? 'Applicable' : 'Not Applicable'} <span className="ml-2">{isApplicable ? '✓' : '✗'}</span>
                  </li>
                </>
              );
            }
            
            // Default parsing
            return (
              <li className="font-medium">
                <strong>Assessment:</strong> {text.replace('CSRD assessment: ', '')}
              </li>
            );
          })()}
        </ul>
      </div>
    );
  };

  const formatTaxonomyAssessment = (text: string) => {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-800">EU Taxonomy Assessment</h4>
        <ul className="list-disc list-outside space-y-1 ml-6 pl-2 text-sm">
          {(() => {
            // Parse detailed CSRD status for comprehensive assessment
            if (text.includes('CSRD status: Article 40a analysis')) {
              const items = [];
              
              // Extract CSRD dependency
              items.push(
                <li key="dependency">
                  <strong>CSRD Dependency:</strong> Not in scope of CSRD Articles 19a/29a 
                  <span className="ml-2">✗</span>
                </li>
              );
              
              // Parse Article 40a details if present
              const euSecuritiesMatch = text.match(/EU securities trading: (\w+)/);
              const euTurnoverMatch = text.match(/EU turnover: ([^;]+)(?:;|$)/);
              
              if (euSecuritiesMatch) {
                const tradingStatus = euSecuritiesMatch[1];
                const isTrading = tradingStatus.toLowerCase() === 'yes';
                items.push(
                  <li key="securities">
                    <strong>EU Securities Trading (CSRD requirement):</strong> {tradingStatus} 
                    <span className="ml-2">{isTrading ? '✓' : '✗'}</span>
                  </li>
                );
              }
              
              if (euTurnoverMatch) {
                const turnoverInfo = euTurnoverMatch[1].trim();
                const meetsThreshold = turnoverInfo.includes('€150M') && !turnoverInfo.includes('Under');
                items.push(
                  <li key="turnover">
                    <strong>EU Turnover (CSRD requirement):</strong> {turnoverInfo} 
                    <span className="ml-2">{meetsThreshold ? '✓' : '✗'}</span>
                  </li>
                );
              }
              
              items.push(
                <li key="result" className="font-medium">
                  <strong>Result:</strong> Not Applicable - EU Taxonomy disclosure requirements 
                  apply only to companies subject to CSRD <span className="ml-2">✗</span>
                </li>
              );
              
              return items;
            }
            
            // Default simple assessment
            return (
              <>
                <li>
                  <strong>CSRD Dependency:</strong> {text.includes('Not subject') ? 'Not in scope of CSRD Articles 19a/29a' : 'In scope of CSRD'} 
                  <span className="ml-2">{text.includes('Not subject') ? '✗' : '✓'}</span>
                </li>
                <li className="font-medium">
                  <strong>Result:</strong> {text.includes('Not subject') ? 'Not Applicable' : 'Applicable'} - 
                  EU Taxonomy disclosure requirements apply only to companies subject to CSRD 
                  <span className="ml-2">{text.includes('Not subject') ? '✗' : '✓'}</span>
                </li>
              </>
            );
          })()}
        </ul>
      </div>
    );
  };

  const formatCSDDDAssessment = (text: string) => {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-800">CSDDD Assessment</h4>
        <ul className="list-disc list-outside space-y-1 ml-6 pl-2 text-sm">
          {(() => {
            const items = [];
            
            // Parse individual thresholds
            if (text.includes('Individual thresholds')) {
              const empMatch = text.match(/employees: ([^(]+)\(([^)]+)\)/);
              const turnoverMatch = text.match(/turnover: ([^(]+)\(([^)]+)\)/);
              
              if (empMatch) {
                const [, empValue, empReq] = empMatch;
                const empMet = empValue.includes('1000') || empValue.includes('3000') || empValue.includes('2999');
                items.push(
                  <li key="emp">
                    <strong>Employee Count:</strong> {empValue.trim()} ({empReq}) 
                    <span className="ml-2">{empMet ? '✓' : '✗'}</span>
                  </li>
                );
              }
              
              if (turnoverMatch) {
                const [, turnoverValue, turnoverReq] = turnoverMatch;
                const turnoverMet = turnoverValue.includes('450') || turnoverValue.includes('900');
                items.push(
                  <li key="turn">
                    <strong>Turnover:</strong> {turnoverValue.trim()} ({turnoverReq}) 
                    <span className="ml-2">{turnoverMet ? '✓' : '✗'}</span>
                  </li>
                );
              }
              
              // Parse consecutive years requirement
              if (text.includes('consecutive years')) {
                const consecutiveMet = text.includes('consecutive years requirement not satisfied') ? false : 
                                    text.includes('consecutive years not verified') ? false : 
                                    text.includes('met but') ? false : true;
                items.push(
                  <li key="consec">
                    <strong>Consecutive Years:</strong> {consecutiveMet ? 'Met for two consecutive years' : 'Not met for two consecutive years'} 
                    <span className="ml-2">{consecutiveMet ? '✓' : '✗'}</span>
                  </li>
                );
              }
            }
            
            // Parse group status
            if (text.includes('Group status')) {
              const groupMatch = text.match(/Group status: ([^;]+)/);
              if (groupMatch) {
                const groupStatus = groupMatch[1].trim();
                const isUltimateParent = groupStatus.includes('ultimate parent');
                items.push(
                  <li key="group">
                    <strong>Group Status:</strong> {groupStatus} 
                    <span className="ml-2">{isUltimateParent ? '✓' : '✗'}</span>
                  </li>
                );
              }
            }
            
            // Parse franchising
            if (text.includes('Franchising')) {
              const franchiseMatch = text.match(/Franchising: ([^.]+)/);
              if (franchiseMatch) {
                const franchiseStatus = franchiseMatch[1].trim();
                const hasFranchising = franchiseStatus.includes('qualifying') && !franchiseStatus.includes('no qualifying');
                items.push(
                  <li key="franchise">
                    <strong>Franchising/Licensing:</strong> {franchiseStatus} 
                    <span className="ml-2">{hasFranchising ? '✓' : '✗'}</span>
                  </li>
                );
              }
            }
            
            // Add result
            const isApplicable = text.includes('inScope: true') || (!text.includes('not met') && !text.includes('not satisfied') && !text.includes('not verified'));
            items.push(
              <li key="result" className="font-medium">
                <strong>Result:</strong> {isApplicable ? 'Applicable' : 'Not Applicable'} 
                <span className="ml-2">{isApplicable ? '✓' : '✗'}</span>
              </li>
            );
            
            return items.length > 0 ? items : (
              <li className="font-medium">
                <strong>Assessment:</strong> {text.replace('CSDDD assessment: ', '')}
              </li>
            );
          })()}
        </ul>
      </div>
    );
  };
  const lawNames: { [key: string]: string } = {
    ungps: 'UN Guiding Principles',
    oecd: 'OECD Guidelines',
    csrd: 'CSRD/ESRS',
    taxonomy: 'EU Taxonomy',
    csddd: 'CSDDD'
  };

  const lawDescriptions: { [key: string]: string } = {
    ungps: 'International framework for business responsibility to respect human rights.',
    oecd: 'Guidelines for multinational enterprises on responsible business conduct.',
    csrd: 'EU directive requiring detailed sustainability reporting and third-party assurance.',
    taxonomy: 'EU classification system defining environmentally sustainable economic activities.',
    csddd: 'EU directive mandating human rights and environmental due diligence across value chains.'
  };

  const lawDetails: { [key: string]: string } = {
    ungps: 'The UN Guiding Principles on Business and Human Rights establish that all businesses have a responsibility to respect human rights. This includes conducting human rights due diligence to identify, prevent, and mitigate adverse impacts, and providing access to remedy when harm occurs. The principles apply regardless of company size, sector, operational context, ownership, or structure.',
    oecd: 'The OECD Guidelines for Multinational Enterprises on Responsible Business Conduct provide recommendations for responsible business conduct. They cover human rights, employment relations, environment, bribery, consumer interests, and other areas. While voluntary, they represent the most comprehensive international framework for corporate responsibility and are backed by a unique grievance mechanism.',
    csrd: 'The Corporate Sustainability Reporting Directive requires companies to disclose information about their impact on people and the environment, and how sustainability matters affect their business. Reports must follow the European Sustainability Reporting Standards (ESRS) and undergo mandatory third-party assurance. This creates transparency and accountability for corporate sustainability performance.',
    taxonomy: 'The EU Taxonomy Regulation establishes criteria for determining whether economic activities qualify as environmentally sustainable. Companies subject to CSRD must disclose the proportion of their activities that align with taxonomy criteria. This helps investors identify sustainable investments and supports the EU\'s climate and environmental goals.',
    csddd: 'The Corporate Sustainability Due Diligence Directive requires large companies to identify, prevent, end, and mitigate adverse human rights and environmental impacts in their operations and value chains. Companies must adopt due diligence policies, conduct regular assessments, take appropriate action, establish complaint procedures, and monitor effectiveness.'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 mr-3" />
              <h1 className="text-4xl font-bold">Applicability Checker</h1>
            </div>
            <p className="text-xl text-purple-100">
              High-level assessment of applicable sustainability frameworks: OECD Guidelines for Multinational Enterprises on Responsible Business Conduct, UNGPs, CSRD/ESRS, EU Taxonomy, and CSDDD
            </p>
            <p className="text-lg text-purple-200 mt-2">
              (Demo Version)
            </p>
          </div>
        </div>

        {/* Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {Object.entries(assessment).map(([law, result]) => (
            <div key={law} className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all duration-300 hover:shadow-xl ${
              result.inScope 
                ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center mb-4">
                <Info className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="font-bold text-xl text-gray-800">{lawNames[law]}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{lawDescriptions[law]}</p>
              <div className={`text-sm mb-3 font-semibold px-3 py-2 rounded-lg ${
                result.inScope 
                  ? 'text-purple-800 bg-purple-100' 
                  : 'text-gray-700 bg-gray-200'
              }`}>
                {result.inScope ? '✓ APPLICABLE' : '✗ NOT APPLICABLE'}
                {(result as any).wave && ` (Wave ${(result as any).wave})`}
                {(result as any).reportingType && (
                  <div className="text-xs font-normal text-purple-700 mt-2">
                    <strong>Reporting Type:</strong> {(result as any).reportingType === 'consolidated' ? 'Consolidated Sustainability Statement' : 
                                    (result as any).reportingType === 'individual' ? 'Individual Sustainability Statement' : 
                                    (result as any).reportingType === 'third_country_group_level' ? 'Group-level Sustainability Report (via EU subsidiary/branch)' : 
                                    (result as any).reportingType}
                  </div>
                )}
              </div>
              <div className="text-gray-800 text-sm mb-3 leading-relaxed">{formatAssessmentText(result.reason)}</div>
              {(result as any).timeline && (
                <div className="text-xs text-purple-700 font-medium mb-3 bg-purple-50 p-2 rounded">
                  <strong>Timeline:</strong> {(result as any).timeline}
                  {(result as any).legalBasis && (
                    <div className="text-xs text-gray-600 font-normal mt-1">
                      <strong>Legal basis:</strong> {(result as any).legalBasis}
                    </div>
                  )}
                </div>
              )}
              {(result as any).automaticExemptions && (result as any).automaticExemptions.length > 0 && (
                <div className="text-xs text-green-700 font-medium mb-3 bg-green-50 p-2 rounded">
                  <strong>✓ Automatic exemptions:</strong> {(result as any).automaticExemptions.map((ex: string) => 
                    ex === 'individual_reporting' ? 'Individual sustainability reporting' : ex
                  ).join(', ')}
                </div>
              )}
              {(result as any).possibleExemptions && (result as any).possibleExemptions.length > 0 && (
                <div className="text-xs text-amber-700 font-medium mb-3 bg-amber-50 p-2 rounded">
                  <strong>⚠ Possible exemptions may apply:</strong> {(result as any).possibleExemptions.map((ex: string) => {
                    switch(ex) {
                      case 'subsidiary_exemption_19a9': return 'Subsidiary exemption (Art. 19a(9))';
                      case 'subsidiary_exemption_29a8': return 'Subsidiary exemption (Art. 29a(8))';
                      case 'opt_out_fy2028_2029': return 'Opt-out for FY 2028-2029';
                      case 'third_country_consolidated_alternative': return 'Third-country consolidated alternative';
                      default: return ex;
                    }
                  }).join(', ')}
                </div>
              )}
              {(result as any).nfrdTransition && (
                <div className="text-xs text-amber-700 font-medium mb-3 bg-amber-50 p-2 rounded">
                  <strong>📋 NFRD transition:</strong> Continue current non-financial reporting until FY 2028
                </div>
              )}
              {(result as any).specializedTiming && (
                <div className="text-xs text-purple-700 font-medium mb-3 bg-purple-50 p-2 rounded">
                  <strong>⚡ Specialized financial entity timing applies</strong>
                </div>
              )}
              {/* EU Taxonomy specific details */}
              {law === 'taxonomy' && (result as any).details && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-purple-100 text-xs">
                  <div className="mb-3">
                    <strong className="text-purple-800">KPIs Required:</strong> <span className="text-gray-700">{(result as any).details.kpis.join(', ')}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-purple-800">Environmental Objectives:</strong>
                    <ol className="list-decimal list-inside text-gray-700 mt-2 space-y-1">
                      {(result as any).details.objectives.map((obj: string, idx: number) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ol>
                  </div>
                  {(result as any).details.phaseIn && (
                    <div>
                      <strong className="text-purple-800">Phase-in Timeline ({(result as any).details.phaseIn.type}):</strong>
                      <div className="mt-2 text-gray-700">{(result as any).details.phaseIn.current}</div>
                      {(result as any).details.phaseIn.future && (
                        <div className="mt-1 text-gray-700">{(result as any).details.phaseIn.future}</div>
                      )}
                      {(result as any).details.phaseIn.additional && (
                        <div className="mt-1 text-purple-700">{(result as any).details.phaseIn.additional}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {(result as any).note && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                  {(result as any).note}
                </div>
              )}
              <button
                onClick={() => setExpandedLaw(expandedLaw === law ? null : law)}
                className="text-xs text-purple-600 hover:text-purple-800 underline font-medium mt-2"
              >
                {expandedLaw === law ? 'Show less' : 'Learn more'}
              </button>
              {expandedLaw === law && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-purple-100 text-sm text-gray-700 leading-relaxed">
                  {lawDetails[law]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-purple-100">
          <h3 className="font-bold text-2xl mb-6 flex items-center text-gray-800">
            <Info className="w-6 h-6 text-purple-600 mr-3" />
            Summary & Next Steps
          </h3>
          
          {assessment.csrd.inScope && (
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-l-4 border-blue-500 shadow-md">
              <h4 className="font-semibold text-blue-800 text-lg mb-2">CSRD Compliance Timeline</h4>
              <p className="text-blue-700 text-sm mb-3 leading-relaxed">
                {assessment.csrd.timeline} - You will need to implement ESRS (European Sustainability Reporting Standards) 
                and ensure external assurance of your sustainability statement.
              </p>
              {assessment.csrd.legalBasis && (
                <p className="text-blue-700 text-sm mb-3">
                  <strong>Legal Basis:</strong> {assessment.csrd.legalBasis}
                </p>
              )}
              {assessment.csrd.reportingType && (
                <p className="text-blue-700 text-sm mb-3">
                  <strong>Reporting Type:</strong> {
                    assessment.csrd.reportingType === 'consolidated' ? 'Consolidated Sustainability Statement (group-level reporting)' :
                    assessment.csrd.reportingType === 'individual' ? 'Individual Sustainability Statement (entity-level reporting)' :
                    assessment.csrd.reportingType === 'third_country_group_level' ? 'Group-level Sustainability Report published by EU subsidiary or branch' :
                    assessment.csrd.reportingType
                  }
                </p>
              )}
            </div>
          )}

          {assessment.taxonomy.inScope && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-500 shadow-md">
              <h4 className="font-semibold text-green-800 text-lg mb-2">EU Taxonomy Disclosure Requirements</h4>
              <p className="text-green-700 text-sm mb-3 leading-relaxed">
                {assessment.taxonomy.timeline} - You must disclose taxonomy-aligned proportions of your economic activities.
              </p>
              {assessment.taxonomy.legalBasis && (
                <p className="text-green-700 text-sm">
                  <strong>Legal Basis:</strong> {assessment.taxonomy.legalBasis}
                </p>
              )}
            </div>
          )}

          {assessment.csddd.inScope && (
            <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-l-4 border-orange-500 shadow-md">
              <h4 className="font-semibold text-orange-800 text-lg mb-2">CSDDD Due Diligence Requirements</h4>
              <p className="text-orange-700 text-sm mb-3 leading-relaxed">
                {assessment.csddd.timeline} - You will need to implement human rights and environmental due diligence 
                processes across your value chain and publish annual due diligence statements.
              </p>
              {(assessment.csddd as any).legalBasis && (
                <p className="text-orange-700 text-sm mb-3">
                  <strong>Legal Basis:</strong> {(assessment.csddd as any).legalBasis}
                </p>
              )}
              
              {/* Holding Company Exemption */}
              {answers.parent_status === 'yes' && answers.subsidiary_status === 'no' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                  <h5 className="font-semibold text-amber-800 mb-3 text-base">🏢 Holding Company Exemption Potential</h5>
                  <p className="text-amber-700 mb-2 text-sm">
                    <strong>Ultimate Parent Company Status:</strong> Your company meets the definition of an ultimate parent company under Article 3(1)(r) CSDDD, as it controls other entities but is not itself controlled by another entity.
                  </p>
                </div>
              )}
            </div>
          )}

          {(assessment.ungps.inScope || assessment.oecd.inScope) && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-l-4 border-yellow-500 shadow-md">
              <h4 className="font-semibold text-yellow-800 text-lg mb-2">Voluntary Frameworks</h4>
              <p className="text-yellow-700 text-sm leading-relaxed">
                While not legally binding, implementing the UN Guiding Principles and OECD Guidelines demonstrates best practice, helps addressing sustainability risk and prepares your organisation for meaningful legal compliance with EU sustainability frameworks.
              </p>
            </div>
          )}

          {/* Indirect Impact Section */}
          {answers.indirect_business_relationships === 'yes' && (
            <div className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-l-4 border-amber-500 shadow-md">
              <h4 className="font-semibold text-amber-800 text-lg mb-4">Potential Indirect Impact via Business Relationships</h4>
              
              <div className="mb-4">
                <h5 className="font-semibold text-amber-800 mb-2">CSDDD Indirect Effects to Your Business:</h5>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Large companies subject to CSDDD must conduct due diligence across their chain of activities. This may impact your business through various appropriate measures including: requests for supplier assessments, contractual clauses requiring human rights and environmental compliance, audits of your operations, potential exclusion from chains of activities if adequate policies are not demonstrated, as well as supportive measures such as financial support, targeted assistance for SMEs, and collaboration with other entities. A chain of activities covers upstream business partners involved in production and immediate downstream partners concerned with distribution, transport and storage (Art. 3(1)(g) CSDDD).
                </p>
              </div>
              
              <div>
                <h5 className="font-semibold text-amber-800 mb-2">CSRD Indirect Effects to Your Business:</h5>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Companies subject to CSRD must report detailed sustainability information including chain of activities data, which may result in: data requests about your environmental and social performance, requirements to complete sustainability questionnaires, demands to obtain sustainability certifications, and increased focus on your climate and sustainability metrics as part of their reporting obligations.
                </p>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 mt-6 p-4 bg-gray-50 rounded-lg">
            <p><strong>Important:</strong> This pre-assessment is based on the information provided and current legal frameworks. It is not a substitute for assessing the specific case of your company. Please note that regulations may change, and specific legal advice should be sought for implementation planning.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mb-8">
          <button
            onClick={restart}
            className="bg-gradient-to-r from-purple-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;