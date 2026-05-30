import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AppProvider, useAppContext } from '../../../src/contexts/AppContext';

function TestConsumer() {
  const { state, setDbOpen, setDbPath, setLanguage, toggleDarkMode, resetState, setSettingsComplete } = useAppContext();
  return (
    <div>
      <div data-testid="dbOpen">{String(state.isDbOpen)}</div>
      <div data-testid="dbPath">{state.dbPath || 'null'}</div>
      <div data-testid="language">{state.language}</div>
      <div data-testid="darkMode">{String(state.isDarkMode)}</div>
      <div data-testid="settingsComplete">{String(state.isSettingsComplete)}</div>
      <button data-testid="btnSetDbOpen" onClick={() => setDbOpen(true)}>Set Open</button>
      <button data-testid="btnSetDbPath" onClick={() => setDbPath('/test/path.hkinv')}>Set Path</button>
      <button data-testid="btnSetLang" onClick={() => setLanguage('en')}>Set EN</button>
      <button data-testid="btnToggleDark" onClick={() => toggleDarkMode()}>Toggle Dark</button>
      <button data-testid="btnReset" onClick={() => resetState()}>Reset</button>
      <button data-testid="btnSetSettings" onClick={() => setSettingsComplete(true)}>Set Settings</button>
    </div>
  );
}

function renderWithProvider() {
  return render(React.createElement(AppProvider, null, React.createElement(TestConsumer)));
}

describe('AppContext', () => {
  it('should initialize with default values', () => {
    renderWithProvider();
    expect(screen.getByTestId('dbOpen').textContent).toBe('false');
    expect(screen.getByTestId('dbPath').textContent).toBe('null');
    expect(screen.getByTestId('settingsComplete').textContent).toBe('false');
  });

  it('should set dbOpen to true', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('btnSetDbOpen'));
    expect(screen.getByTestId('dbOpen').textContent).toBe('true');
  });

  it('should set dbPath', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('btnSetDbPath'));
    expect(screen.getByTestId('dbPath').textContent).toBe('/test/path.hkinv');
  });

  it('should set language', () => {
    renderWithProvider();
    const lang = screen.getByTestId('language').textContent;
    expect(['it', 'en']).toContain(lang);
    fireEvent.click(screen.getByTestId('btnSetLang'));
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  it('should toggle dark mode', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('btnToggleDark'));
    expect(screen.getByTestId('darkMode').textContent).toBe('true');
    fireEvent.click(screen.getByTestId('btnToggleDark'));
    expect(screen.getByTestId('darkMode').textContent).toBe('false');
  });

  it('should reset state', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('btnSetDbOpen'));
    expect(screen.getByTestId('dbOpen').textContent).toBe('true');
    fireEvent.click(screen.getByTestId('btnReset'));
    expect(screen.getByTestId('dbOpen').textContent).toBe('false');
    expect(screen.getByTestId('dbPath').textContent).toBe('null');
  });

  it('should set settings complete', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('btnSetSettings'));
    expect(screen.getByTestId('settingsComplete').textContent).toBe('true');
  });
});
