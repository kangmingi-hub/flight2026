import React, { useState } from 'react';
import { Club, DailyRecord } from '../types';

interface DailyInputProps {
  club: Club;
  onSave: (record: DailyRecord) => void;
  onClose: () => void;
}

export const DailyInput: React.FC<DailyInputProps> = ({ club, onSave, onClose }) => {
  const today = new Date().toISOString().split('T')[0];
  const existing = club.records.find(r => r.date === today);

  const [form, setForm] = useState<DailyRecord>({
    date: today,
    evangelism: existing?.evangelism ?? 0,
    effectiveEvangelism: existing?.effectiveEvangelism ?? 0,
    attendance: existing?.attendance ?? 0,
    baptism: existing?.baptism ?? 0,
  });

  const fields: { key: keyof Omit<DailyRecord, 'date'>; label: string; sublabel: string }[] = [
    { key: 'evangelism', label: '단순전도', sublabel: 'Simple Evangelism' },
    { key: 'effectiveEvangelism', label: '유효전도', sublabel: 'Effective Evangelism' },
    { key: 'attendance', label: '출석', sublabel: 'Attendance' },
    { key: 'baptism', label: '침례', sublabel: 'Baptism' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>일일 수치 입력</h2>
          <p className="modal-subtitle">{club.name} · {form.date}</p>
        </div>

        <div className="modal-body">
          <label className="date-input-group">
            <span>날짜</span>
            <input
              type="date"
              value={form.date}
              onChange={e => {
                const d = e.target.value;
                const found = club.records.find(r => r.date === d);
                setForm(found ? { ...found } : { date: d, evangelism: 0, effectiveEvangelism: 0, attendance: 0, baptism: 0 });
              }}
            />
          </label>

          {fields.map(f => (
            <div key={f.key} className="daily-field">
              <div className="daily-field-label">
                <span>{f.label}</span>
                <span className="daily-field-sub">{f.sublabel}</span>
              </div>
              <input
                type="number"
                min={0}
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={() => { onSave(form); onClose(); }}>저장</button>
        </div>
      </div>
    </div>
  );
};
