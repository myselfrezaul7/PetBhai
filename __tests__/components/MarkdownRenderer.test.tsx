import React from 'react';
import { render, screen } from '@testing-library/react';
import MarkdownRenderer, { generateHeadingId } from '../../components/MarkdownRenderer';

describe('generateHeadingId', () => {
  it('supports Bengali unicode characters', () => {
    const id = generateHeadingId('⚡ বয়স্ক কুকুরের স্পেশাল ডায়েট');
    expect(id).toBe('বয়স্ক-কুকুরের-স্পেশাল-ডায়েট');
  });

  it('supports English headings with punctuation and extra dashes', () => {
    const id = generateHeadingId('Hello World! What is this?');
    expect(id).toBe('hello-world-what-is-this');
  });

  it('falls back to section when string is only symbols', () => {
    const id = generateHeadingId('⚡ 💡 ✨');
    expect(id).toBe('section');
  });
});

describe('MarkdownRenderer', () => {
  it('renders standard h2 and h3 markdown headings with unicode IDs', () => {
    const content = '## বয়স্ক কুকুরের ডায়েট\n\n### জরুরি টিপস';
    const { container } = render(<MarkdownRenderer content={content} />);

    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveAttribute('id', 'বয়স্ক-কুকুরের-ডায়েট');
    expect(h2).toHaveTextContent('বয়স্ক কুকুরের ডায়েট');

    const h3 = container.querySelector('h3');
    expect(h3).toBeInTheDocument();
    expect(h3).toHaveAttribute('id', 'জরুরি-টিপস');
    expect(h3).toHaveTextContent('জরুরি টিপস');
  });

  it('renders bold lines as h2 headings with IDs', () => {
    const content = '**কুকুরের যত্ন**\n\nসাধারণ টেক্সট';
    const { container } = render(<MarkdownRenderer content={content} />);

    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveAttribute('id', 'কুকুরের-যত্ন');
    expect(h2).toHaveTextContent('কুকুরের যত্ন');
  });

  it('renders standard markdown links with theme colors', () => {
    const content = 'Visit [PetBhai Shop](https://petbhai.com/shop) today!';
    render(<MarkdownRenderer content={content} />);

    const link = screen.getByRole('link', { name: 'PetBhai Shop' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://petbhai.com/shop');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.className).toContain('hover:text-orange-500');
    expect(link.className).toContain('underline');
  });

  it('renders buttons alongside standard links', () => {
    const content = '[BUTTON: Click Here](https://petbhai.com/btn)';
    render(<MarkdownRenderer content={content} />);

    const btnLink = screen.getByRole('link', { name: 'Click Here' });
    expect(btnLink).toBeInTheDocument();
    expect(btnLink.className).toContain('from-amber-500');
  });

  it('renders blockquotes starting with >', () => {
    const content = '> **সতর্কতা:** পানি পরিবর্তন করুন।';
    const { container } = render(<MarkdownRenderer content={content} />);

    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote?.className).toContain('border-l-4');
    expect(blockquote?.className).toContain('border-amber-500');
    expect(blockquote).toHaveTextContent('সতর্কতা: পানি পরিবর্তন করুন।');
  });
});
