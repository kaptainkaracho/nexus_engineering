import type { ImpactReport } from '@nexus-engineering/shared';

export type ExportFormat = 'json' | 'markdown' | 'csv' | 'pdf';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toCsv(report: ImpactReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Impact Report Export');
  lines.push('');
  lines.push('Summary');
  lines.push('Risk Level,Total Affected,Direct,Indirect,Transitive,Requirements,Features,Tests,ADRs,Min Confidence,Max Confidence');
  lines.push(
    `${report.riskLevel},${report.summary.totalAffected},${report.summary.directCount},${report.summary.indirectCount},${report.summary.transitiveCount},${report.summary.requirementCount},${report.summary.featureCount},${report.summary.testCount},${report.summary.adrCount},${report.summary.minConfidence},${report.summary.maxConfidence}`,
  );
  lines.push('');

  // Requirements
  lines.push('Requirements');
  lines.push('ID,Title,Type,Impact Level,Confidence,Confidence Score');
  if (report.affectedRequirements.length === 0) {
    lines.push('_None_');
  } else {
    for (const a of report.affectedRequirements) {
      lines.push(`${a.id},"${a.title}",${a.type},${a.impactLevel},${a.confidence},${a.confidenceScore}`);
    }
  }
  lines.push('');

  // Features
  lines.push('Features');
  lines.push('ID,Title,Type,Impact Level,Confidence,Confidence Score');
  if (report.affectedFeatures.length === 0) {
    lines.push('_None_');
  } else {
    for (const a of report.affectedFeatures) {
      lines.push(`${a.id},"${a.title}",${a.type},${a.impactLevel},${a.confidence},${a.confidenceScore}`);
    }
  }
  lines.push('');

  // Tests
  lines.push('Tests');
  lines.push('ID,Title,Type,Impact Level,Confidence,Confidence Score');
  if (report.affectedTests.length === 0) {
    lines.push('_None_');
  } else {
    for (const a of report.affectedTests) {
      lines.push(`${a.id},"${a.title}",${a.type},${a.impactLevel},${a.confidence},${a.confidenceScore}`);
    }
  }
  lines.push('');

  // ADRs
  lines.push('Architecture Decisions');
  lines.push('ID,Title,Type,Impact Level,Confidence,Confidence Score');
  if (report.affectedAdrs.length === 0) {
    lines.push('_None_');
  } else {
    for (const a of report.affectedAdrs) {
      lines.push(`${a.id},"${a.title}",${a.type},${a.impactLevel},${a.confidence},${a.confidenceScore}`);
    }
  }
  lines.push('');

  // Recommendations
  lines.push('Recommendations');
  lines.push('Severity,Category,Message');
  if (report.recommendations.length === 0) {
    lines.push('_None_');
  } else {
    for (const r of report.recommendations) {
      lines.push(`${r.severity},${r.category},"${r.message}"`);
    }
  }

  return lines.join('\n');
}

export function toMarkdownImproved(report: ImpactReport): string {
  const lines: string[] = [];
  const generatedAt = report.metadata.generatedAt
    ? new Date(report.metadata.generatedAt).toLocaleString()
    : 'Unknown';

  lines.push('# Impact Report');
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| **Risk Level** | ${report.riskLevel.toUpperCase()} |`);
  lines.push(`| **Generated** | ${generatedAt} |`);
  lines.push(`| **Total Affected** | ${report.summary.totalAffected} |`);
  lines.push(`| **Confidence Range** | ${Math.round(report.summary.minConfidence * 100)}% – ${Math.round(report.summary.maxConfidence * 100)}% |`);
  if (report.metadata.changeDescription) {
    lines.push(`| **Change** | ${report.metadata.changeDescription} |`);
  }
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('| --- | --- |');
  lines.push(`| Direct | ${report.summary.directCount} |`);
  lines.push(`| Indirect | ${report.summary.indirectCount} |`);
  lines.push(`| Transitive | ${report.summary.transitiveCount} |`);
  lines.push(`| Requirements | ${report.summary.requirementCount} |`);
  lines.push(`| Features | ${report.summary.featureCount} |`);
  lines.push(`| Tests | ${report.summary.testCount} |`);
  lines.push(`| ADRs | ${report.summary.adrCount} |`);
  lines.push('');

  // Artifact groups
  const groups: Array<[string, ImpactReport['affectedRequirements']]> = [
    ['Requirements', report.affectedRequirements],
    ['Features', report.affectedFeatures],
    ['Tests', report.affectedTests],
    ['Architecture Decisions', report.affectedAdrs],
  ];

  for (const [title, items] of groups) {
    lines.push(`## ${title}`);
    lines.push('');
    if (items.length === 0) {
      lines.push('_None affected._');
    } else {
      lines.push('| ID | Title | Type | Impact | Confidence | Score |');
      lines.push('| --- | --- | --- | --- | --- | --- |');
      for (const a of items) {
        lines.push(
          `| ${a.id} | ${a.title} | ${a.type} | ${a.impactLevel} | ${a.confidence} | ${Math.round(a.confidenceScore * 100)}% |`,
        );
      }
      lines.push('');
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    lines.push('| Severity | Category | Message |');
    lines.push('| --- | --- | --- |');
    for (const r of report.recommendations) {
      lines.push(`| ${r.severity.toUpperCase()} | ${r.category} | ${r.message} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function printAsPdf(report: ImpactReport) {
  const generatedAt = report.metadata.generatedAt
    ? new Date(report.metadata.generatedAt).toLocaleString()
    : 'Unknown';

  const groups: Array<[string, ImpactReport['affectedRequirements']]> = [
    ['Requirements', report.affectedRequirements],
    ['Features', report.affectedFeatures],
    ['Tests', report.affectedTests],
    ['Architecture Decisions', report.affectedAdrs],
  ];

  const artifactTables = groups
    .map(([title, items]) => {
      if (items.length === 0) {
        return `<h2>${title}</h2><p><em>None affected.</em></p>`;
      }
      const rows = items
        .map(
          (a) =>
            `<tr><td>${a.id}</td><td>${escapeHtml(a.title)}</td><td>${a.type}</td><td>${a.impactLevel}</td><td>${a.confidence}</td><td>${Math.round(a.confidenceScore * 100)}%</td></tr>`,
        )
        .join('');
      return `<h2>${title}</h2><table><thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Impact</th><th>Confidence</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join('');

  const recs =
    report.recommendations.length > 0
      ? `<h2>Recommendations</h2><table><thead><tr><th>Severity</th><th>Category</th><th>Message</th></tr></thead><tbody>${report.recommendations
          .map((r) => `<tr><td>${r.severity.toUpperCase()}</td><td>${r.category}</td><td>${escapeHtml(r.message)}</td></tr>`)
          .join('')}</tbody></table>`
      : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Impact Report</title>
      <style>
        @page { margin: 1.5in; size: letter; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; }
        h1 { font-size: 20px; margin: 0 0 8px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; }
        h2 { font-size: 14px; margin: 20px 0 8px; color: #334155; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid; }
        th, td { border: 1px solid #e2e8f0; padding: 4px 8px; text-align: left; }
        th { background: #f8fafc; font-weight: 600; font-size: 10px; text-transform: uppercase; }
        .overview { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .overview-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; }
        .overview-item .label { font-size: 9px; text-transform: uppercase; color: #64748b; }
        .overview-item .value { font-size: 14px; font-weight: 700; }
        .risk-critical { color: #dc2626; }
        .risk-high { color: #ea580c; }
        .risk-medium { color: #d97706; }
        .risk-low { color: #16a34a; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <h1>Impact Report</h1>
      <div class="overview">
        <div class="overview-item"><div class="label">Risk Level</div><div class="value risk-${report.riskLevel}">${report.riskLevel.toUpperCase()}</div></div>
        <div class="overview-item"><div class="label">Total Affected</div><div class="value">${report.summary.totalAffected}</div></div>
        <div class="overview-item"><div class="label">Generated</div><div class="value" style="font-weight:400;font-size:11px">${generatedAt}</div></div>
        <div class="overview-item"><div class="label">Direct</div><div class="value">${report.summary.directCount}</div></div>
        <div class="overview-item"><div class="label">Indirect</div><div class="value">${report.summary.indirectCount}</div></div>
        <div class="overview-item"><div class="label">Transitive</div><div class="value">${report.summary.transitiveCount}</div></div>
        <div class="overview-item"><div class="label">Confidence</div><div class="value" style="font-weight:400;font-size:11px">${Math.round(report.summary.minConfidence * 100)}% – ${Math.round(report.summary.maxConfidence * 100)}%</div></div>
        <div class="overview-item"><div class="label">Requirements</div><div class="value">${report.summary.requirementCount}</div></div>
        <div class="overview-item"><div class="label">Features</div><div class="value">${report.summary.featureCount}</div></div>
        <div class="overview-item"><div class="label">Tests</div><div class="value">${report.summary.testCount}</div></div>
        <div class="overview-item"><div class="label">ADRs</div><div class="value">${report.summary.adrCount}</div></div>
        ${report.metadata.changeDescription ? `<div class="overview-item" style="grid-column: span 3"><div class="label">Change</div><div class="value" style="font-weight:400;font-size:11px">${escapeHtml(report.metadata.changeDescription)}</div></div>` : ''}
      </div>
      ${artifactTables}
      ${recs}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    }, 250);
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function getExportFilename(format: ExportFormat): string {
  const ts = new Date().toISOString().slice(0, 10);
  switch (format) {
    case 'json':
      return `impact-report-${ts}.json`;
    case 'markdown':
      return `impact-report-${ts}.md`;
    case 'csv':
      return `impact-report-${ts}.csv`;
    case 'pdf':
      return `impact-report-${ts}.pdf`;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
