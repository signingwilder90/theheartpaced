// Sources. A DOI is given only where it was read from the article itself or confirmed
// by search; other entries carry a PubMed search link.

const pm = q => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`;

export const REFS = [
  { key: 'crossley2011', text: 'Crossley GH, Poole JE, Rozner MA, et al. The Heart Rhythm Society (HRS)/American Society of Anesthesiologists (ASA) expert consensus statement on the perioperative management of patients with implantable defibrillators, pacemakers and arrhythmia monitors: facilities and patient management. Heart Rhythm 2011;8:1114–54.', url: pm('Crossley HRS ASA expert consensus perioperative management implantable defibrillators pacemakers arrhythmia monitors 2011') },
  { key: 'asa2011', text: 'American Society of Anesthesiologists. Practice advisory for the perioperative management of patients with cardiac implantable electronic devices: pacemakers and implantable cardioverter-defibrillators. An updated report by the ASA Task Force. Anesthesiology 2011;114:247–61.', url: pm('Practice advisory perioperative management cardiac implantable electronic devices Anesthesiology 2011 114 247') },
  { key: 'asa2020', text: 'Practice advisory for the perioperative management of patients with cardiac implantable electronic devices: pacemakers and implantable cardioverter–defibrillators 2020. An updated report by the American Society of Anesthesiologists Task Force. Anesthesiology 2020;132:225–52.', url: 'https://pubmed.ncbi.nlm.nih.gov/32032098/' },
  { key: 'wan2024', text: 'Wan EY, Rogers AJ, et al. Periprocedural management and multidisciplinary care pathways for patients with cardiac implantable electronic devices: a scientific statement from the American Heart Association. Circulation 2024 (published online July 10, 2024).', doi: '10.1161/CIR.0000000000001264' },
  { key: 'sj2018', text: 'Cronin B, Essandoh MK. Perioperative interrogation of St. Jude cardiovascular implantable electronic devices: a guide for anesthesiologists. J Cardiothorac Vasc Anesth 2018;32:982–1000.', doi: '10.1053/j.jvca.2017.11.050' },
  { key: 'bsc2019', text: 'Cronin B, Birgersdotter-Green U, Essandoh MK. Perioperative interrogation of Boston Scientific cardiovascular implantable electronic devices: a guide for anesthesiologists. J Cardiothorac Vasc Anesth 2019;33:1076–89.', doi: '10.1053/j.jvca.2018.05.005' },
  { key: 'bio2019', text: 'Cronin B, Dalia A, Sandoval K, Birgersdotter-Green U, Sherer E, Essandoh MK. Perioperative interrogation of Biotronik cardiovascular implantable electronic devices: a guide for anesthesiologists. J Cardiothorac Vasc Anesth 2019;33:3427–36.', doi: '10.1053/j.jvca.2019.03.001' },
  { key: 'mdt2020', text: 'Cronin B, Dalia A, Nguyen QS, Sandoval K, Birgersdotter-Green U, Maus T, Essandoh MK. Perioperative interrogation of Medtronic cardiovascular implantable electronic devices: a guide for anesthesiologists. J Cardiothorac Vasc Anesth 2020;34:2465–75.', doi: '10.1053/j.jvca.2019.09.012' },
  { key: 'nbg2002', text: 'Bernstein AD, Daubert JC, Fletcher RD, et al. The revised NASPE/BPEG generic code for antibradycardia, adaptive-rate, and multisite pacing. Pacing Clin Electrophysiol 2002;25:260–4.', doi: '10.1046/j.1460-9592.2002.00260.x' },
  { key: 'indik2017', text: 'Indik JH, Gimbel JR, Abe H, et al. 2017 HRS expert consensus statement on magnetic resonance imaging and radiation exposure in patients with cardiovascular implantable electronic devices. Heart Rhythm 2017;14:e97–153.', doi: '10.1016/j.hrthm.2017.04.025' },
  { key: 'schulman2013', text: 'Schulman PM, et al. Case report: use caution when applying magnets to pacemakers or defibrillators for surgery. Anesth Analg 2013;117:422–7.', url: 'https://pubmed.ncbi.nlm.nih.gov/23757477/' },
  { key: 'ramsdale2012', text: 'Ramsdale DR, Rao A. Programmable functions and terminology. In: Cardiac Pacing and Device Therapy. London: Springer; 2012:193–213.' },
  { key: 'aveir', text: 'Abbott. AVEIR DR leadless pacemaker: magnet response tip card.' },
  { key: 'lecture', text: 'Perioperative management of cardiac implantable electronic devices. Cardiothoracic Fellowship Lecture Series (simulation session slides).' },
  { key: 'card', text: 'CIED peri-operative bedside card, pacemaker/ICD, non-cardiac surgery. Two-sided draft for discussion, 7 October 2026; not approved. Its own sources: ASA 2020; AHA statement 2024; 2024 AHA/ACC guideline; HRS/ASA 2011; Abbott AVEIR DR magnet tip card; Boston Scientific magnet bulletin 2021; Medtronic magnet letter 2024; manuals.' },
];

export const REF_INDEX = Object.fromEntries(REFS.map((r, i) => [r.key, i + 1]));
