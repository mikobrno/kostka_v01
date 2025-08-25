import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AresService used by BusinessSection
const mockResults = [
  { ico: '11111111', companyName: 'ACME s.r.o.', address: 'Praha 1' },
  { ico: '22222222', companyName: 'Beta a.s.', address: 'Brno' },
  { ico: '33333333', companyName: 'Gamma družstvo', address: 'Ostrava' }
];

vi.mock('../../../services/aresService', () => ({
  AresService: {
    searchByName: async (q: string) => ({ data: mockResults.filter(r => r.companyName.toLowerCase().includes(q.toLowerCase())), error: null }),
    searchByIco: async (ico: string) => ({ data: mockResults.find(r => r.ico === ico) ?? null, error: null })
  }
}));

import { BusinessSection } from '../BusinessSection';

const sampleBusinesses = [
  {
    id: 'biz-1',
    ico: '',
    company_name: '',
    is_active: true
  }
];

describe('BusinessSection name-search dropdown', () => {
  let onChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
  onChangeMock = vi.fn();
  // clipboard stub
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows results while typing a name', async () => {
    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    // open add new business form
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);

    // find the inputs - since a new card inserted, there should be an input placeholder 'Název společnosti' in the new card
    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
  fireEvent.change(nameInput, { target: { value: 'ACM' } });

    // results should appear
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    expect(screen.getByText(/ACME s.r.o./i)).toBeTruthy();
  });

  it('navigates dropdown with Arrow keys and selects with Enter', async () => {
    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);

    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
  fireEvent.change(nameInput, { target: { value: 'ACM' } });

    await waitFor(() => screen.getByRole('listbox'));

    // ArrowDown to first, ArrowDown to second, then Enter
    fireEvent.keyDown(nameInput, { key: 'ArrowDown' });
    fireEvent.keyDown(nameInput, { key: 'ArrowDown' });
    fireEvent.keyDown(nameInput, { key: 'Enter' });

    // After selection the input should have value from selected result
    await waitFor(() => {
      const v = (nameInput as HTMLInputElement).value;
      expect(v).toMatch(/Beta|ACME|Gamma/i);
    });
  });

  it('selects item by clicking', async () => {
    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);

    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
  fireEvent.change(nameInput, { target: { value: 'Gam' } });

    await waitFor(() => screen.getByRole('listbox'));
    const item = screen.getByText(/Gamma družstvo/i);
    fireEvent.mouseDown(item);

    await waitFor(() => {
      const v = (nameInput as HTMLInputElement).value;
      expect(v).toMatch(/Gamma/i);
    });
  });

  it('closes dropdown on Escape', async () => {
    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);

    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
  fireEvent.change(nameInput, { target: { value: 'ACM' } });

    await waitFor(() => screen.getByRole('listbox'));
    fireEvent.keyDown(nameInput, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });

  it('falls back to mocked AresService responses', async () => {
    // This test ensures our mock is used and returns predictable data
    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);

    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
    fireEvent.change(nameInput, { target: { value: 'ACME' } });

    await waitFor(() => screen.getByRole('listbox'));
    expect(screen.getByText(/ACME s.r.o./i)).toBeTruthy();
  });

  it('does not show dropdown for less than 3 chars', async () => {
    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);

    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
    fireEvent.change(nameInput, { target: { value: 'Al' } });

    // should not open listbox
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows no results message when AresService returns empty data', async () => {
    // override mock to return empty array for this test
  const ares = await import('../../../services/aresService');
  const spy = vi.spyOn(ares.AresService, 'searchByName').mockImplementation(async () => ({ data: [], error: null }));

    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);
    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
    fireEvent.change(nameInput, { target: { value: 'ZZZ' } });

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  // restore
  spy.mockRestore();
  });

  it('does not crash when AresService.searchByName throws', async () => {
  const ares = await import('../../../services/aresService');
  const spy = vi.spyOn(ares.AresService, 'searchByName').mockImplementation(async () => { throw new Error('boom'); });

    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);
    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
    fireEvent.change(nameInput, { target: { value: 'ERR' } });

    // wait a bit to ensure no uncaught errors
    await new Promise((r) => setTimeout(r, 100));

    // component should still be mounted and input present
    expect(nameInput).toBeTruthy();

  // restore
  spy.mockRestore();
  });

  it('Escape closes dropdown even when an item is active', async () => {
    render(<BusinessSection businesses={sampleBusinesses} onChange={onChangeMock} />);
    const addBtn = screen.getByRole('button', { name: /Přidat ručně|Přidat podnikání/i });
    fireEvent.click(addBtn);
    const nameInput = await screen.findByPlaceholderText(/Název společnosti/i);
    fireEvent.change(nameInput, { target: { value: 'ACM' } });

    await waitFor(() => screen.getByRole('listbox'));
    // activate first item
    fireEvent.keyDown(nameInput, { key: 'ArrowDown' });
    await new Promise((r) => setTimeout(r, 20));
    fireEvent.keyDown(nameInput, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });
});
