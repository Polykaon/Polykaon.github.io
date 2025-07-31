import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LegalDisclaimerProps {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ expanded, setExpanded }) => (
  <div className="mt-8 p-3 bg-gray-100 border border-gray-300 rounded-xl shadow-sm">
    <button
      onClick={() => setExpanded(!expanded)}
      className="flex items-center justify-between w-full text-left"
    >
      <span className="font-semibold text-gray-800 text-sm">Legal Disclaimer</span>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />
      )}
    </button>
    
    {expanded && (
      <div className="mt-3 text-xs text-gray-700 space-y-2">
        <div>
          <p className="font-bold mb-1">No Legal Advice</p>
          <p>This questionnaire provides general information only and does not constitute legal advice or create any attorney-client relationship. Results are generated through automated processes and cannot account for specific circumstances affecting your legal obligations.</p>
        </div>
        <div>
          <p className="font-bold mb-1">Professional Consultation Recommended</p>
          <p>Companies should seek qualified legal and compliance advice before making business decisions based on these results. EU sustainability laws are complex and frequently updated.</p>
        </div>
        <div>
          <p className="font-bold mb-1">Accuracy and Completeness</p>
          <p>While we strive for accuracy, this tool may not reflect the most recent legal developments. Users should verify information independently and consult official EU legislative sources.</p>
        </div>
        <div>
          <p className="font-bold mb-1">Limitation of Liability</p>
          <p>The authors disclaim all liability for decisions made in reliance on this questionnaire. Users assume full responsibility for compliance with applicable laws and regulations.</p>
        </div>
      </div>
    )}
  </div>
);

export default LegalDisclaimer;