import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  searchQuery: string;
  selectedTags: string[];
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  clearSearch: () => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  isSearching: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const isSearching = searchQuery.trim().length > 0 || selectedTags.length > 0;

  const value: SearchContextType = {
    searchQuery,
    selectedTags,
    setSearchQuery,
    setSelectedTags,
    clearSearch,
    addTag,
    removeTag,
    isSearching,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 