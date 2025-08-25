import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AresService module used by EmployerInfo (resolves to src/services/aresService)
const mockResults = [
  { ico: '12345678', companyName: 'Firma A', address: 'Praha' },
  { ico: '87654321', companyName: 'Firma B', address: 'Brno' }
];
vi.mock('../../../services/aresService', () => ({
  AresService: {
    searchByName: async () => ({ data: mockResults, error: null }),
    searchByIco: async (ico: string) => ({ data: mockResults.find(r => r.ico === ico) ?? null, error: null }),
  }
}));

import { EmployerInfo } from '../EmployerInfo';

const baseData = {
  ico: '',
  companyName: '',
  companyAddress: '',
  netIncome: '',
  jobPosition: '',
  contractType: '',
  contractFromDate: '',
  contractToDate: '',
  contractExtended: '',
  employedSince: ''
};

describe('EmployerInfo', () => {
  let onChange: (d: any) => void;
  let onChangeMock: any;

  beforeEach(() => {
    onChangeMock = vi.fn();
    onChange = onChangeMock;
  // mock clipboard
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('copies value to clipboard (fallback via navigator.clipboard)', async () => {
    render(<EmployerInfo data={baseData} onChange={onChange} />);
    const copyButtons = screen.getAllByRole('button', { name: /Kopírovat/i });
    // find first copy button (IČO)
    expect(copyButtons.length).toBeGreaterThan(0);
    fireEvent.click(copyButtons[0]);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('navigates dropdown with keyboard and selects via Enter', async () => {
    // Mock AresService.searchByName used inside component
    // We stub the service by mocking module import via vitest mock or global
    const mockResults = [
      { ico: '12345678', companyName: 'Firma A', address: 'Praha' },
      { ico: '87654321', companyName: 'Firma B', address: 'Brno' }
    ];

  render(<EmployerInfo data={baseData} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Název společnosti/i);
    fireEvent.change(input, { target: { value: 'Fir' } });

    // wait for results to appear
    await waitFor(() => screen.getByRole('listbox'));

    // press ArrowDown twice and Enter to select second item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // onChange should have been called with updated ico/companyName/companyAddress
    await waitFor(() => {
      expect(onChangeMock).toHaveBeenCalled();
    });
  });
});
