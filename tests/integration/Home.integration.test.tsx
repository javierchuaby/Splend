import { render } from '@testing-library/react-native';
import React from 'react';
import Home from '../../app/(tabs)/Home';

describe('Home Screen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<Home />)).not.toThrow();
  });

  it('contains basic UI elements', () => {
    const { getByText } = render(<Home />);
    
    expect(getByText('My Trips')).toBeTruthy();
    expect(getByText('+ New Trip')).toBeTruthy();
  });

  it('displays empty state when no trips exist', () => {
    const { getByText } = render(<Home />);
    
    expect(getByText('No trips yet')).toBeTruthy();
    expect(getByText('Create your first group trip to get started!')).toBeTruthy();
  });

  it('displays modal elements when rendered', () => {
    const { getByText, getAllByText } = render(<Home />);
    
    expect(getByText('New Trip')).toBeTruthy();
    expect(getByText('Create')).toBeTruthy();
    
    const cancelButtons = getAllByText('Cancel');
    expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('displays date picker modal elements', () => {
    const { getByText, getAllByText } = render(<Home />);
    
    expect(getByText('Select Start Date')).toBeTruthy();
    expect(getByText('Select End Date')).toBeTruthy();
    
    const doneButtons = getAllByText('Done');
    expect(doneButtons.length).toBeGreaterThanOrEqual(2); // One for start date, one for end date
  });

  it('displays trip form elements', () => {
    const { getByPlaceholderText } = render(<Home />);
    
    expect(getByPlaceholderText('Enter trip name')).toBeTruthy();
    expect(getByPlaceholderText('Describe your trip...')).toBeTruthy();
    expect(getByPlaceholderText('Search users by username or display name')).toBeTruthy();
  });
});