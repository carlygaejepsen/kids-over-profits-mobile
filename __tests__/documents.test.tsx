import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import DocumentsScreen from '@/app/documents/[slug]';
import { useDocuments } from '@/api/queries';
import { SourceLink } from '@/components/site/Source';
import { docKindOf, imageViewerHtml, pdfViewerHtml, sizeLabel } from '@/lib/docs';
import { docHref, resolveLink } from '@/lib/links';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/api/queries', () => ({ useDocuments: jest.fn() }));

const library = require('./fixtures/documents-12155.json');
const ok = (data: unknown) => ({ data, isLoading: false, isError: false, error: null, refetch: jest.fn() });

const WOODBURY = 'https://kidsoverprofits.org/wp-content/uploads/2024/12/woodbury-1010.pdf#page=2';

beforeEach(() => mockPush.mockClear());

describe('document links open in the app', () => {
  it('sends our own PDFs to the viewer, the cited page kept', () => {
    expect(resolveLink(WOODBURY)).toEqual({
      kind: 'route',
      href: { pathname: '/doc', params: { url: WOODBURY.replace('#page=2', ''), page: '2' } },
    });
    expect(resolveLink('/wp-content/uploads/2025/01/photo.JPG')).toMatchObject({ kind: 'route', href: { pathname: '/doc' } });
  });

  it('sends a page library (#documents) to the documents screen', () => {
    expect(resolveLink('https://kidsoverprofits.org/facility/copper-canyon-academy-az/#documents')).toEqual({
      kind: 'route',
      href: { pathname: '/documents/[slug]', params: { slug: 'copper-canyon-academy-az', kind: 'facility' } },
    });
    expect(resolveLink('/operator/cedu/#documents')).toMatchObject({ href: { params: { slug: 'cedu', kind: 'operator' } } });
  });

  it("opens another site's PDF in the viewer on iOS only; Word files stay in the browser", () => {
    expect(resolveLink('https://court.example.gov/order.pdf', 'ios')).toMatchObject({ kind: 'route' });
    expect(resolveLink('https://court.example.gov/order.pdf', 'android')).toEqual({ kind: 'web', url: 'https://court.example.gov/order.pdf' });
    expect(resolveLink('https://kidsoverprofits.org/wp-content/uploads/a.docx')).toMatchObject({ kind: 'web' });
  });

  it('a "source" link to a Woodbury page pushes the viewer', async () => {
    await render(<SourceLink items={[{ cite: 'Woodbury Reports, October 2010, p. 2', url: WOODBURY }]} />);
    await fireEvent.press(screen.getByText('source'));
    expect(mockPush).toHaveBeenCalledWith(docHref(WOODBURY));
  });
});

describe('viewer pages', () => {
  it('knows a PDF, a picture and the rest', () => {
    expect(docKindOf('https://x.org/a/b.PDF?x=1')).toBe('pdf');
    expect(docKindOf('/wp-content/uploads/a.webp')).toBe('image');
    expect(docKindOf('/wp-content/uploads/a.docx')).toBe('other');
    expect(docKindOf('anything', 'pdf')).toBe('pdf');
  });

  it('words sizes', () => {
    expect(sizeLabel(0)).toBe('');
    expect(sizeLabel(2048)).toBe('2 KB');
    expect(sizeLabel(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(sizeLabel(25 * 1024 * 1024)).toBe('25 MB');
  });

  it('writes the address and start page into the pdf.js page, never a closing script tag', () => {
    const html = pdfViewerHtml('https://kidsoverprofits.org/a.pdf?</script><b>', 21);
    expect(html).toContain('START=21');
    expect(html).not.toContain('</script><b>');
    expect(html).toContain('pdf.worker.min.js');
    expect(pdfViewerHtml('https://kidsoverprofits.org/a.pdf', 0)).toContain('START=1');
    expect(imageViewerHtml('https://kidsoverprofits.org/a.png')).toContain('src="https://kidsoverprofits.org/a.png"');
  });
});

describe('documents screen', () => {
  it('lists the folders with their counts and opens a document in the viewer', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: 'copper-canyon-academy-az' });
    (useDocuments as jest.Mock).mockReturnValue(ok(library));
    await render(<DocumentsScreen />);
    expect(useDocuments).toHaveBeenCalledWith('facility', 'copper-canyon-academy-az');
    expect(screen.getByText('Copper Canyon Academy')).toBeTruthy();
    expect(screen.getByText(`${library.total} documents`)).toBeTruthy();
    const folder = library.folders[0];
    const head = screen.getByLabelText(`${folder.name}, ${folder.count} documents`);
    expect(screen.queryByText(folder.files[0].title)).toBeNull();
    await fireEvent.press(head);
    await fireEvent.press(screen.getByText(folder.files[0].title));
    expect(mockPush).toHaveBeenCalledWith(docHref(folder.files[0].url, folder.files[0].title));
  });

  it("lists a company's program libraries and opens one", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: 'cedu', kind: 'operator' });
    (useDocuments as jest.Mock).mockReturnValue(
      ok({ ...library, kind: 'operator', name: 'CEDU', total: 0, files: [], folders: [], programs: [{ name: 'Rocky Mountain Academy', slug: 'rocky-mountain-academy-id', count: 12 }] }),
    );
    await render(<DocumentsScreen />);
    expect(useDocuments).toHaveBeenCalledWith('operator', 'cedu');
    expect(screen.getByText('No documents filed here yet.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Rocky Mountain Academy'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/documents/[slug]', params: { slug: 'rocky-mountain-academy-id', kind: 'facility' } });
  });
});
