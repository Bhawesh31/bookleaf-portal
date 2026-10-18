import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UrgencyBadge } from '../components/common/UrgencyBadge';
import { StatusBadge } from '../components/common/StatusBadge';

describe('UrgencyBadge Component', () => {
  it('renders Critical priority badge', () => {
    render(<UrgencyBadge priority="Critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders High priority badge', () => {
    render(<UrgencyBadge priority="High" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders Medium priority badge', () => {
    render(<UrgencyBadge priority="Medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders Low priority badge', () => {
    render(<UrgencyBadge priority="Low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });
});

describe('StatusBadge Component', () => {
  it('renders Open status badge', () => {
    render(<StatusBadge status="Open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders In Progress status badge', () => {
    render(<StatusBadge status="In Progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders Resolved status badge', () => {
    render(<StatusBadge status="Resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });
});
