import React, { useState } from 'react';
import { CheckCircle, Printer, X, Sparkles, Copy, Check, School, Download } from 'lucide-react';

interface MasterCertificateModalProps {
  onClose: () => void;
  studentName?: string;
  completionDate?: string;
  certificateId?: string;
}

export const MasterCertificateModal: React.FC<MasterCertificateModalProps> = ({
  onClose,
  studentName: defaultStudentName,
  completionDate,
  certificateId: defaultCertId,
}) => {
  const [studentName, setStudentName] = useState(
    defaultStudentName || localStorage.getItem('csa_student_name') || 'Gokul'
  );
  const [rollNumber, setRollNumber] = useState(
    localStorage.getItem('csa_student_roll') || '211421104001'
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formattedDate = completionDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const certId = defaultCertId || `SAEC-CYBER-${Math.floor(100000 + Math.random() * 900000)}-${new Date().getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(certId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveStudent = (name: string, roll: string) => {
    setStudentName(name);
    setRollNumber(roll);
    localStorage.setItem('csa_student_name', name);
    localStorage.setItem('csa_student_roll', roll);
  };

  // Instant High-Resolution 2000x1414 (A4 Landscape 200DPI) PNG Download
  const handleDownloadPNG = () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1414; // Strict A4 Landscape Aspect Ratio
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Pure White Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer Royal Blue Border
      ctx.strokeStyle = '#1E3A8A';
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Inner Gold Border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.strokeRect(46, 46, canvas.width - 92, canvas.height - 92);

      // Decorative Corner Boxes
      const cornerSize = 40;
      ctx.strokeStyle = '#1E3A8A';
      ctx.lineWidth = 3;
      ctx.strokeRect(55, 55, cornerSize, cornerSize);
      ctx.strokeRect(canvas.width - 55 - cornerSize, 55, cornerSize, cornerSize);
      ctx.strokeRect(55, canvas.height - 55 - cornerSize, cornerSize, cornerSize);
      ctx.strokeRect(canvas.width - 55 - cornerSize, canvas.height - 55 - cornerSize, cornerSize, cornerSize);

      // Header: S.A. ENGINEERING COLLEGE
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'bold 54px Georgia, serif';
      ctx.fillText('S.A. ENGINEERING COLLEGE', canvas.width / 2, 135);

      ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('(An Autonomous Institution, Affiliated to Anna University, Chennai)', canvas.width / 2, 172);

      ctx.font = '400 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText("Accredited by NBA & NAAC with 'A' Grade • Approved by AICTE, New Delhi", canvas.width / 2, 202);
      ctx.fillText('Poonamallee - Avadi Main Road, Thiruverkadu, Chennai - 600 077, Tamil Nadu, India', canvas.width / 2, 228);

      // Department Header
      ctx.font = 'bold 26px Georgia, serif';
      ctx.fillStyle = '#1E3A8A';
      ctx.fillText('DEPARTMENT OF MASTER OF COMPUTER APPLICATIONS (MCA)', canvas.width / 2, 275);

      ctx.font = 'italic 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Cyber Security & Web Vulnerability Research Laboratory', canvas.width / 2, 304);

      // Divider Line
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(150, 328);
      ctx.lineTo(canvas.width - 150, 328);
      ctx.stroke();

      // Certificate of Completion Title
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#B8860B';
      ctx.fillText('CERTIFICATE OF MERIT & EXCELLENCE', canvas.width / 2, 370);

      ctx.font = 'bold 60px Georgia, serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 440);

      ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Advanced Web Penetration Testing & Chained Exploitation Mastery', canvas.width / 2, 482);

      // Gold accent bar
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 100, 505);
      ctx.lineTo(canvas.width / 2 + 100, 505);
      ctx.stroke();

      // Recipient text
      ctx.font = 'italic 26px Georgia, serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('This is to proudly certify that', canvas.width / 2, 555);

      // Student Name
      ctx.font = 'bold 52px Georgia, serif';
      ctx.fillStyle = '#1E3A8A';
      ctx.fillText(studentName, canvas.width / 2, 630);

      // Student Name underline in Gold
      const nameWidth = ctx.measureText(studentName).width;
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - nameWidth / 2 - 20, 646);
      ctx.lineTo(canvas.width / 2 + nameWidth / 2 + 20, 646);
      ctx.stroke();

      if (rollNumber) {
        ctx.font = '600 20px "Courier New", monospace';
        ctx.fillStyle = '#64748B';
        ctx.fillText(`Register No: ${rollNumber}`, canvas.width / 2, 680);
      }

      // Citation paragraph
      ctx.font = '21px Georgia, serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('of S.A. Engineering College has successfully completed the rigorous hands-on Capstone Assessment:', canvas.width / 2, 735);
      ctx.fillText('Operation Titan Breach. The student demonstrated practical mastery in chaining critical web vulnerabilities,', canvas.width / 2, 768);
      ctx.fillText('discovering and exploiting SQL Injection Authentication Bypass (CWE-89), Stored Cross-Site Scripting (CWE-79),', canvas.width / 2, 801);
      ctx.fillText('and Business Logic Price Subversion (CWE-840).', canvas.width / 2, 834);

      // Badges Row
      const badges = [
        '✔ SQL Injection Bypass (CWE-89)',
        '✔ Stored XSS Execution (CWE-79)',
        '✔ Logic Breach & Coupon SQLi',
        '✔ 20 Curriculum Labs Cleared'
      ];
      ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let startX = 265;
      badges.forEach((b) => {
        const w = ctx.measureText(b).width + 32;
        ctx.fillStyle = '#EFF6FF';
        ctx.beginPath();
        ctx.roundRect(startX, 875, w, 34, [17]);
        ctx.fill();
        ctx.strokeStyle = '#BFDBFE';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#1E3A8A';
        ctx.fillText(b, startX + w / 2, 898);
        startX += w + 18;
      });

      // Divider for signatures
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(150, 960);
      ctx.lineTo(canvas.width - 150, 960);
      ctx.stroke();

      // Signatures
      // Left: Prof. Sankar
      ctx.font = 'italic bold 30px Georgia, serif';
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'left';
      ctx.fillText('Prof. Sankar', 200, 1030);

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(200, 1045);
      ctx.lineTo(440, 1045);
      ctx.stroke();

      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('LAB IN-CHARGE / FACULTY COORDINATOR', 200, 1072);
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Department of MCA • S.A. Engineering College', 200, 1098);

      // Center: Official Stamp
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#1E3A8A';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 1060, 56, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 1060, 48, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#1E3A8A';
      ctx.fillText('SEAL OF MERIT', canvas.width / 2, 1055);
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('SAEC • MCA', canvas.width / 2, 1074);

      // Right: HOD
      ctx.textAlign = 'right';
      ctx.font = 'italic bold 30px Georgia, serif';
      ctx.fillStyle = '#1E293B';
      ctx.fillText('Head of the Department', canvas.width - 200, 1030);

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(canvas.width - 440, 1045);
      ctx.lineTo(canvas.width - 200, 1045);
      ctx.stroke();

      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('HOD • DEPARTMENT OF MCA', canvas.width - 200, 1072);
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('S.A. Engineering College, Chennai', canvas.width - 200, 1098);

      // Footer info
      ctx.font = '16px "Courier New", monospace';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'left';
      ctx.fillText(`Issue Date: ${formattedDate}`, 150, 1200);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#047857';
      ctx.fillText('✔ Verified by Cyber Security Academy Examination Cell', canvas.width / 2, 1200);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`Certificate No: ${certId}`, canvas.width - 150, 1200);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `SAEC_Certificate_${studentName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.error('Failed to generate PNG download', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-300">
      {/* Print-specific style block: Clean Single-Page A4 Landscape */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden;
          }
          #saec-official-certificate, #saec-official-certificate * {
            visibility: visible;
          }
          #saec-official-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 24px 36px !important;
            box-sizing: border-box !important;
            border: 6px solid #1e3a8a !important;
            background: #ffffff !important;
            color: #0f172a !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="relative w-full max-w-4xl my-auto">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white text-xs sm:text-sm font-bold tracking-tight">S.A. Engineering College &bull; MCA</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold uppercase">
                  Verified Academic Award
                </span>
              </div>
              <p className="text-slate-400 text-[11px] font-mono">
                No: <span className="text-amber-400">{certId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyId}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Copy Certificate ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy ID'}</span>
            </button>

            {/* Direct 1-Click PNG Download */}
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 disabled:opacity-50"
              title="Download high-resolution image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating...' : 'Download Image'}</span>
            </button>

            {/* PDF Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
              title="Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE COLLEGE CERTIFICATE (Responsive & Perfectly Fitted)
           ───────────────────────────────────────────────────────────── */}
        <div
          id="saec-official-certificate"
          className="relative bg-[#FFFFFF] text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-7 border-[5px] border-[#1E3A8A] overflow-hidden select-text"
        >
          {/* Subtle Outer Thin Border */}
          <div className="absolute inset-1.5 border border-[#D4AF37] pointer-events-none rounded-lg" />

          {/* Decorative Corner Flairs */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#1E3A8A] pointer-events-none" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#1E3A8A] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#1E3A8A] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#1E3A8A] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">

            {/* 1. S.A. ENGINEERING COLLEGE AT THE VERY TOP */}
            <div className="w-full flex flex-col items-center border-b border-[#1E3A8A]/20 pb-2.5 mb-2.5">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-md border-2 border-[#D4AF37] shrink-0">
                  <School className="w-6 h-6 text-amber-300" />
                </div>
                <div className="text-center">
                  <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-black text-[#1E3A8A] tracking-wider uppercase leading-none">
                    S.A. ENGINEERING COLLEGE
                  </h1>
                  <p className="text-[10px] sm:text-[11px] font-sans text-slate-600 font-semibold tracking-wide mt-0.5">
                    (An Autonomous Institution, Affiliated to Anna University, Chennai)
                  </p>
                  <p className="text-[9px] text-slate-500 font-sans leading-tight">
                    Accredited by NBA &amp; NAAC with &lsquo;A&rsquo; Grade &bull; Approved by AICTE, New Delhi &bull; Chennai - 600 077
                  </p>
                </div>
              </div>

              <div className="mt-1 text-xs font-serif font-bold text-[#1E3A8A] tracking-wide uppercase">
                Department of Master of Computer Applications (MCA)
              </div>
              <div className="text-[10px] font-sans text-slate-500">
                Cyber Security &amp; Web Vulnerability Research Laboratory
              </div>
            </div>

            {/* 2. CERTIFICATE TITLE */}
            <div className="my-1">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#B8860B] uppercase">
                Certificate of Merit &amp; Excellence
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                CERTIFICATE OF COMPLETION
              </h2>
              <p className="text-[11px] sm:text-xs font-sans text-slate-600 font-medium">
                Advanced Web Penetration Testing &amp; Chained Exploitation Mastery
              </p>
            </div>

            <div className="w-24 h-0.5 bg-[#D4AF37] my-1.5" />

            {/* 3. RECIPIENT LINE */}
            <p className="text-[11px] sm:text-xs font-serif italic text-slate-600">
              This is to proudly certify that
            </p>

            {/* Student Name & Roll Number */}
            <div className="my-1.5 relative group">
              {isEditingName ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <input
                    type="text"
                    value={studentName}
                    placeholder="Student Name"
                    onChange={(e) => handleSaveStudent(e.target.value, rollNumber)}
                    className="font-serif text-xl font-bold text-[#1E3A8A] border-b-2 border-[#1E3A8A] bg-transparent text-center focus:outline-none px-3 py-0.5"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={rollNumber}
                    placeholder="Roll / Reg No."
                    onChange={(e) => handleSaveStudent(studentName, e.target.value)}
                    className="font-mono text-xs font-semibold text-slate-700 border-b-2 border-slate-400 bg-transparent text-center focus:outline-none px-2 py-0.5"
                  />
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="no-print px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#1E3A8A] tracking-wide border-b-2 border-[#D4AF37] pb-0.5 px-6 min-w-[240px]">
                      {studentName}
                    </h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="no-print opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600 text-[10px] font-mono underline"
                      title="Edit student name & register number"
                    >
                      ✎ Edit
                    </button>
                  </div>
                  {rollNumber && (
                    <span className="text-[11px] font-mono font-medium text-slate-500 mt-0.5">
                      Register No: <strong className="text-slate-700">{rollNumber}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 4. CITATION STATEMENT */}
            <p className="max-w-2xl text-[11px] sm:text-xs text-slate-700 leading-relaxed font-serif my-1.5">
              of <strong className="font-sans text-slate-900">S.A. Engineering College</strong> has successfully
              completed the rigorous hands-on Capstone Assessment: <strong className="font-sans text-slate-900">Operation Titan Breach</strong>.
              The student demonstrated practical mastery in chaining critical web vulnerabilities, discovering and exploiting
              <strong className="text-[#1E3A8A] font-sans font-semibold"> SQL Injection Authentication Bypass (CWE-89)</strong>,
              <strong className="text-[#1E3A8A] font-sans font-semibold"> Stored Cross-Site Scripting (CWE-79)</strong>, and
              <strong className="text-[#1E3A8A] font-sans font-semibold"> Business Logic Price Subversion (CWE-840)</strong>.
            </p>

            {/* 5. COMPETENCIES BADGES */}
            <div className="flex flex-wrap items-center justify-center gap-2 my-2 max-w-2xl">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-mono font-semibold">
                <Check className="w-3 h-3 text-blue-600" />
                <span>SQL Injection Bypass (CWE-89)</span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-mono font-semibold">
                <Check className="w-3 h-3 text-blue-600" />
                <span>Stored XSS Execution (CWE-79)</span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-mono font-semibold">
                <Check className="w-3 h-3 text-blue-600" />
                <span>Logic Breach &amp; Coupon SQLi</span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-semibold">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>20 Curriculum Labs Cleared</span>
              </span>
            </div>

            {/* 6. SIGNATURES AND COLLEGE STAMP */}
            <div className="w-full max-w-3xl mt-3 pt-3 border-t border-slate-300 flex items-center justify-between gap-4">

              {/* Left Signature: Faculty / Lab In-Charge (Prof. Sankar) */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="font-serif italic text-sm sm:text-base text-slate-800 font-bold border-b border-slate-400 pb-0.5 w-40 text-center">
                  Prof. Sankar
                </div>
                <div className="text-[10px] font-bold text-slate-900 uppercase font-sans mt-0.5">
                  Lab In-Charge / Faculty Coordinator
                </div>
                <div className="text-[9px] text-slate-500 font-sans">
                  Department of MCA &bull; S.A. Engineering College
                </div>
              </div>

              {/* Center: Official College Seal */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-2 border-double border-[#1E3A8A] flex flex-col items-center justify-center p-0.5 text-center bg-blue-50/50 shadow-inner">
                  <div className="w-full h-full rounded-full border border-dashed border-[#D4AF37] flex flex-col items-center justify-center text-[#1E3A8A]">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-[6px] font-black uppercase tracking-wider font-mono">
                      SEAL OF MERIT
                    </span>
                    <span className="text-[5px] font-mono text-slate-500">SAEC &bull; MCA</span>
                  </div>
                </div>
              </div>

              {/* Right Signature: Head of Department */}
              <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
                <div className="font-serif italic text-sm sm:text-base text-slate-800 font-bold border-b border-slate-400 pb-0.5 w-40 text-center">
                  Head of the Department
                </div>
                <div className="text-[10px] font-bold text-slate-900 uppercase font-sans mt-0.5">
                  HOD &bull; Department of MCA
                </div>
                <div className="text-[9px] text-slate-500 font-sans">
                  S.A. Engineering College, Chennai
                </div>
              </div>

            </div>

            {/* Bottom Verification Strip */}
            <div className="w-full max-w-3xl mt-2.5 pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-500">
              <div>
                <span>Issue Date: </span>
                <strong className="text-slate-800">{formattedDate}</strong>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                <span>Verified by Cyber Security Academy Examination Cell</span>
              </div>
              <div>
                <span>Certificate No: </span>
                <strong className="text-slate-800">{certId}</strong>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Helpful Hints (Hidden in Print) */}
        <div className="no-print mt-2 text-center text-[11px] text-slate-400 font-mono flex items-center justify-center gap-4">
          <span>📥 Click <strong className="text-emerald-400">&quot;Download Image&quot;</strong> for instant high-res PNG</span>
          <span>&bull;</span>
          <span>🖨️ Click <strong className="text-blue-400">&quot;Print / PDF&quot;</strong> for clean A4 landscape PDF</span>
        </div>
      </div>
    </div>
  );
};
