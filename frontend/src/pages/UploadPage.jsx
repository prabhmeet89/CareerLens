import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
  FileCheck,
  Cpu,
  Layers,
  FileUp,
  Zap,
} from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  // Processing state & step tracker
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Uploading, 2: Extracting, 3: AI Analyzing, 4: Done

  const steps = [
    { label: 'Uploading PDF to Secure Storage', icon: UploadCloud },
    { label: 'Extracting Resume Text & Metadata', icon: FileText },
    { label: 'Anthropic Claude AI Structuring Profile', icon: Cpu },
    { label: 'Generating Career Skill Graph', icon: Layers },
  ];

  const validateFile = (file) => {
    setError(null);
    if (!file) return false;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file type. Please select a valid PDF document (.pdf).');
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit. Please upload a smaller PDF.`);
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Step 1: Uploading PDF
      setCurrentStep(1);
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const uploadRes = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const resumeId = uploadRes.data?.data?.resumeId;
      if (!resumeId) {
        throw new Error('Upload succeeded but no resume ID was returned.');
      }

      // Step 2 & 3: Extracting & AI Analyzing
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep(3);

      const analyzeRes = await api.post(`/resume/${resumeId}/analyze`);

      if (!analyzeRes.data?.success) {
        throw new Error(analyzeRes.data?.message || 'Failed to analyze resume with AI.');
      }

      // Step 4: Done!
      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 800));

      // Redirect to newly generated profile page
      navigate('/profile', { replace: true });
    } catch (err) {
      console.error('[UploadPage Error]:', err);
      const msg =
        err.response?.data?.message ||
        err.customMessage ||
        err.message ||
        'An error occurred while uploading and analyzing your resume. Please try again.';
      setError(msg);
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  // Instant demo loader for development testing
  const handleQuickDemoLoad = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setCurrentStep(1);
      await new Promise((r) => setTimeout(r, 400));
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 400));
      setCurrentStep(3);
      await api.post('/profile/dev-seed');
      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 600));
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.customMessage || 'Quick load failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-linkedin-border rounded-[10px] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-linkedin-blue text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Phase 2 &bull; AI Resume Analysis</span>
        </div>
        <h1 className="text-2xl font-bold text-linkedin-text-primary">
          Upload Your Resume
        </h1>
        <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1 max-w-xl">
          Upload your PDF resume to let Anthropic Claude extract your verified skills, projects, education, and career track into a structured profile.
        </p>
      </div>

      {/* Main Upload / Processing Card */}
      <div className="bg-white border border-linkedin-border rounded-[10px] p-6 sm:p-8 shadow-sm">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Upload / Processing Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Processing State View */}
        {isProcessing ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-linkedin-blue-light flex items-center justify-center border-2 border-linkedin-blue animate-pulse">
                <Cpu className="w-10 h-10 text-linkedin-blue animate-bounce" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                <Spinner size="sm" color="text-linkedin-blue" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-linkedin-text-primary">
                Analyzing Your Resume with Claude AI...
              </h2>
              <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1">
                Please wait while we extract your experience and generate your profile.
              </p>
            </div>

            {/* Stepper tracker */}
            <div className="w-full max-w-md space-y-3 text-left pt-2">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const stepNum = idx + 1;
                const isCurrent = currentStep === stepNum;
                const isDone = currentStep > stepNum;

                return (
                  <div
                    key={step.label}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-linkedin-blue-light/40 border-linkedin-blue text-linkedin-blue font-semibold'
                        : isDone
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Spinner size="sm" color="text-linkedin-blue" />
                    ) : (
                      <StepIcon className="w-5 h-5 shrink-0 text-gray-400" />
                    )}
                    <span className="text-xs sm:text-sm flex-1">{step.label}</span>
                    {isDone && (
                      <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Done
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Normal Upload View */
          <div className="space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200
                ${
                  dragActive
                    ? 'border-linkedin-blue bg-linkedin-blue-light/60 scale-[0.99]'
                    : 'border-[#00000030] hover:border-linkedin-blue bg-[#F8FAFC] hover:bg-[#F1F5F9]'
                }
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center shadow-sm">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div>
                  <p className="text-sm sm:text-base font-bold text-linkedin-text-primary">
                    Drag and drop your resume PDF here
                  </p>
                  <p className="text-xs text-linkedin-text-secondary mt-1">
                    or <span className="text-linkedin-blue font-semibold underline">browse files from your computer</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-linkedin-text-muted mt-2 pt-2 border-t border-gray-200">
                  <span>Supports: <strong>PDF only</strong></span>
                  <span>&bull;</span>
                  <span>Max file size: <strong>5 MB</strong></span>
                </div>
              </div>
            </div>

            {/* Standard Accessible File Input Control */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gray-50 border border-linkedin-border rounded-lg">
              <label htmlFor="resume-pdf-selector" className="text-xs font-semibold text-linkedin-text-primary shrink-0 flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-linkedin-blue" />
                <span>Choose PDF:</span>
              </label>
              <input
                id="resume-pdf-selector"
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="w-full text-xs text-linkedin-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-linkedin-blue-light file:text-linkedin-blue hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {/* Quick Demo Loader Shortcut in Dev */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs">
              <div className="flex items-center gap-2 text-linkedin-blue">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">Want to test instantly with sample student data?</span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemoLoad}
                className="font-bold text-linkedin-blue hover:text-linkedin-blue-hover underline"
              >
                Quick-Load Sample Profile
              </button>
            </div>

            {/* Selected File Card */}
            {selectedFile && (
              <div className="p-4 bg-white border border-linkedin-border rounded-xl shadow-sm flex items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-linkedin-text-primary truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-linkedin-text-secondary">
                      {formatFileSize(selectedFile.size)} &bull; Ready for analysis
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-linkedin-border">
              <div className="text-xs text-linkedin-text-secondary flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Text is analyzed using Anthropic Claude models</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {selectedFile && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleRemoveFile}
                    className="w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedFile}
                  onClick={handleUploadAndAnalyze}
                  className="w-full sm:w-auto font-bold"
                  icon={Sparkles}
                >
                  Analyze Resume
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Guidance Card */}
      <div className="bg-white border border-linkedin-border rounded-[10px] p-5 shadow-sm text-xs text-linkedin-text-secondary space-y-2">
        <h3 className="font-bold text-linkedin-text-primary text-sm">
          💡 Tips for Best AI Extraction Results
        </h3>
        <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
          <li>Ensure your PDF is text-selectable (not a flat image scan).</li>
          <li>Include specific project descriptions and the technologies utilized.</li>
          <li>List your degree program, major/field of study, and institution name clearly.</li>
          <li>You can re-upload an updated resume at any time to refresh your skill profile.</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;
