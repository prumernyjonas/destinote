"use client";

import React from "react";

interface ArticleFormFieldsProps {
  title: string;
  summary: string;
  content: string;
  selectedCountryId: string;
  coverAlt: string;
  countries: Array<{ id: string; name: string; iso_code: string }>;
  loadingCountries: boolean;
  isPending?: boolean;
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onCoverAltChange: (value: string) => void;
}

export function ArticleFormFields({
  title,
  summary,
  content,
  selectedCountryId,
  coverAlt,
  countries,
  loadingCountries,
  isPending = false,
  onTitleChange,
  onSummaryChange,
  onContentChange,
  onCountryChange,
  onCoverAltChange,
}: ArticleFormFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Název <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Např. Můj výlet do Peru"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Perex (volitelné)
        </label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="Krátké uvedení článku"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Země (volitelné)
        </label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={selectedCountryId}
          onChange={(e) => onCountryChange(e.target.value)}
          disabled={isPending}
        >
          <option value="">-- Vyberte zemi (volitelné) --</option>
          {loadingCountries ? (
            <option disabled>Načítání zemí...</option>
          ) : (
            countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))
          )}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Vyberte zemi, o které článek pojednává. Pokud článek není o konkrétní zemi, můžete toto pole ponechat prázdné.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Obsah <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={10}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Text článku..."
          disabled={isPending}
        />
      </div>
    </>
  );
}
