import React, { useState } from 'react';
import {
  getTaxonomyDetails,
  addFutureComplianceConsiderations,
  assessCSRDScope,
  assessCSDDD,
  type Answers
} from './utils/helpers';
import { questions } from './data/questions';
import QuestionForm from './components/QuestionForm';
import ReportViewer from './components/ReportViewer';
import LegalDisclaimer from './components/LegalDisclaimer';

const EUSustainabilityQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState<boolean>(false);
  const [expandedLaw, setExpandedLaw] = useState<string | null>(null);
  const [disclaimerExpanded, setDisclaimerExpanded] = useState<boolean>(false);
  const [reportDisclaimerExpanded, setReportDisclaimerExpanded] = useState<boolean>(false);

  const updateAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  // Helper functions for readable labels

  const getVisibleQuestions = () => {
    return questions.filter(step => !step.show || step.show(answers));
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentStep];

  const nextStep = () => {
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowReport(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const restart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowReport(false);
    setExpandedLaw(null);
    setDisclaimerExpanded(false);
    setReportDisclaimerExpanded(false);
  };

  const visibleStepQuestions = currentQuestion?.questions?.filter(q => 
    !q.condition || q.condition(answers)
  ) || [];

  const allAnswered = visibleStepQuestions.every(q => 
    !q.required || answers[q.key] !== undefined
  );

  const assessScope = () => {
    const assessment = {
      ungps: { inScope: true, reason: 'The UN Guiding Principles apply to all businesses regardless of size or location.', timeline: 'Applicable since 2011' },
      oecd: { inScope: false, reason: '', timeline: '' },
      csrd: { inScope: false, reason: '', timeline: '', wave: null as number | null, reportingType: null as string | null, automaticExemptions: [] as string[], possibleExemptions: [] as string[], legalBasis: null as string | null },
      taxonomy: { inScope: false, reason: '', timeline: '', details: null as any, legalBasis: null as string | null, note: null as string | null },
      csddd: { inScope: false, reason: '', timeline: '', wave: null as number | null }
    };

    // OECD Guidelines Assessment
    if (answers.multinational_enterprise === 'yes' && answers.oecd_adherent_countries === 'yes') {
      assessment.oecd.inScope = true;
      assessment.oecd.reason = 'The OECD Guidelines for Multinational Enterprises on Responsible Business Conduct apply to multinational enterprises operating in or from adherent countries.';
      assessment.oecd.timeline = 'Applicable since 2023 (latest update)';
    } else {
      // Detailed explanation for why OECD doesn't apply
      let oecdReason = 'OECD Guidelines assessment: ';
      if (answers.multinational_enterprise === 'no') {
        oecdReason += 'Multinational enterprise status: No (operates domestically only) - Guidelines apply to multinational enterprises only.';
      } else if (answers.multinational_enterprise === 'yes' && answers.oecd_adherent_countries === 'no') {
        oecdReason += 'Multinational enterprise status: Yes, but operates only in non-adherent countries - Guidelines apply to enterprises operating in or from adherent countries.';
      } else {
        oecdReason += 'Multinational enterprise status not determined or incomplete assessment.';
      }
      assessment.oecd.reason = oecdReason;
    }

    // CSRD Assessment following EC Decision Matrix structure
    const csrdAssessment = assessCSRDScope(answers);
    assessment.csrd = csrdAssessment;

    // EU Taxonomy follows CSRD scope for Articles 19a/29a
    // Article 40a companies are NOT subject to EU Taxonomy
    if (assessment.csrd.inScope && assessment.csrd.legalBasis !== 'Article 40a Accounting Directive') {
      assessment.taxonomy.inScope = true;
      assessment.taxonomy.reason = 'Subject to EU Taxonomy Article 8 as you are in scope of CSRD (Articles 19a/29a).';
      assessment.taxonomy.timeline = assessment.csrd.timeline;
      assessment.taxonomy.legalBasis = 'Article 8 of Regulation (EU) 2020/852 (EU Taxonomy)';
      
      // Add specific details based on undertaking type
      const taxonomyDetails = getTaxonomyDetails(answers);
      assessment.taxonomy.details = taxonomyDetails;
    } else if (assessment.csrd.inScope && assessment.csrd.legalBasis === 'Article 40a Accounting Directive') {
      assessment.taxonomy.reason = 'EU Taxonomy assessment: Not subject to Article 8 as Article 40a companies are excluded from Taxonomy disclosure obligations under CSRD framework.';
      assessment.taxonomy.note = 'Note: If your company voluntarily chooses to prepare consolidated sustainability statements in accordance with ESRS instead of Article 40a reports, EU subsidiaries can only be exempted from their reporting if you include their Taxonomy disclosures.';
    } else {
      assessment.taxonomy.reason = 'EU Taxonomy assessment: Not subject to Article 8 as you are not in scope of CSRD Articles 19a/29a. ' + 
        (assessment.csrd.reason ? 'CSRD status: ' + assessment.csrd.reason.substring(0, 150) + '...' : '');
    }

    // CSDDD Assessment
    const csdddScope = assessCSDDD(answers);
    assessment.csddd = csdddScope;

    // Add future compliance considerations
    addFutureComplianceConsiderations(assessment, answers);

    return assessment;
  };






  if (showReport) {
    const assessment = assessScope();
    
    return (
      <>
        <ReportViewer
          assessment={assessment}
          answers={answers}
          expandedLaw={expandedLaw}
          setExpandedLaw={setExpandedLaw}
          restart={restart}
        />
        <div className="max-w-5xl mx-auto px-6">
          <LegalDisclaimer expanded={reportDisclaimerExpanded} setExpanded={setReportDisclaimerExpanded} />
        </div>
      </>
    );
  }

  return (
    <>
      <QuestionForm
        currentStep={currentStep}
        currentQuestion={currentQuestion}
        totalSteps={visibleQuestions.length}
        answers={answers}
        allAnswered={allAnswered}
        updateAnswer={updateAnswer}
        nextStep={nextStep}
        prevStep={prevStep}
      />
      <div className="max-w-4xl mx-auto px-6">
        <LegalDisclaimer expanded={disclaimerExpanded} setExpanded={setDisclaimerExpanded} />
      </div>
    </>
  );
};

export default EUSustainabilityQuestionnaire;