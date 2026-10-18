import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  DollarSign,
  Globe,
  Layers,
  Printer,
  Search,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { authorApi } from '../../api/author';
import { Book } from '../../types';

export const MyBooks: React.FC = () => {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('title');

  const { data: books, isLoading, error } = useQuery({
    queryKey: ['author-books', search, genre, status, sortBy],
    queryFn: () => authorApi.getBooks({ search, genre, status, sort_by: sortBy }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Published Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete catalog of your published titles, in-production manuscripts, pricing, and distribution channels.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, ISBN..."
            className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          aria-label="Filter by Genre"
          className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
        >
          <option value="">All Genres</option>
          <option value="Fiction">Fiction</option>
          <option value="Non-Fiction">Non-Fiction</option>
          <option value="Poetry">Poetry</option>
          <option value="Romance">Romance</option>
          <option value="Self-Help">Self-Help</option>
          <option value="Thriller">Thriller</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by Status"
          className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="Published & Live">Published & Live</option>
          <option value="In Production">In Production</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort by"
          className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
        >
          <option value="title">Sort by Title (A-Z)</option>
          <option value="copies">Sort by Copies Sold (High to Low)</option>
          <option value="date">Sort by Publication Date</option>
        </select>
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          Failed to load books. Please try refreshing.
        </div>
      ) : books?.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium">No books matched your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {books?.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

const BookCard: React.FC<{ book: Book }> = ({ book }) => {
  const isLive = book.status === 'Published & Live';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-smooth overflow-hidden flex flex-col justify-between">
      <div className="p-6 space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-400/20'
            }`}
          >
            {book.status}
          </span>
          <span className="text-xs font-mono text-slate-400 font-medium">
            {book.book_id}
          </span>
        </div>

        {/* Title and Genre */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {book.title}
          </h2>
          <div className="mt-1 flex items-center space-x-2 text-xs text-slate-500">
            <span className="font-medium text-brand-700">{book.genre}</span>
            <span>•</span>
            <span className="font-mono">ISBN: {book.isbn}</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 bg-slate-50/50 rounded-xl px-3">
          <div>
            <div className="text-[11px] font-medium text-slate-500">MRP</div>
            <div className="text-sm font-bold text-slate-800">
              {book.mrp !== null ? `₹${book.mrp}` : <span className="text-slate-400 font-normal italic">In Production</span>}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Sold Copies</div>
            <div className="text-sm font-bold text-slate-800">
              {book.total_copies_sold.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Total Royalty</div>
            <div className="text-sm font-bold text-emerald-600">
              ₹{book.total_royalty_earned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Royalty Status Sub-bar */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <div>
            Paid: <span className="font-semibold text-slate-800">₹{book.royalty_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            Pending: <span className="font-semibold text-amber-600">₹{book.royalty_pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Distribution Channels */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Distribution Channels</span>
          </div>
          {book.available_on.length === 0 ? (
            <span className="text-xs text-slate-400 italic">Listing pending release</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {book.available_on.map((platform) => (
                <span
                  key={platform}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {platform}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1">
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>Printer: {book.print_partner || 'Pending assignment'}</span>
        </div>
        <div>
          Pub Date: {book.publication_date || 'In Production'}
        </div>
      </div>
    </div>
  );
};
