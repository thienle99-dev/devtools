import { useState, useEffect, type ChangeEvent } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type SchemaType = 'Article' | 'Product' | 'Organization' | 'Person' | 'Website' | 'LocalBusiness' | 'BreadcrumbList';

// Helper Input component with Label
const SchemaInput = ({ label, className, ...props }: any) => (
    <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="relative">
            <input
                {...props}
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    </div>
);

export const StructuredDataGenerator = () => {
  const [type, setType] = useState<SchemaType>('Article');
  const [data, setData] = useState<Record<string, any>>({});
  const [output, setOutput] = useState('');

  const updateField = (key: string, value: string) => {
      setData(prev => ({ ...prev, [key]: value }));
  };

  const renderInputs = () => {
      switch (type) {
          case 'Article':
              return (
                  <>
                    <SchemaInput label="Headline" value={data.headline || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('headline', e.target.value)} placeholder="Article Title" />
                    <SchemaInput label="Image URL" value={data.image || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('image', e.target.value)} placeholder="https://example.com/image.jpg" />
                    <SchemaInput label="Author Name" value={data.author || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('author', e.target.value)} placeholder="John Doe" />
                    <SchemaInput label="Date Published" value={data.datePublished || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('datePublished', e.target.value)} type="date" />
                    <SchemaInput label="Publisher Name" value={data.publisher || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('publisher', e.target.value)} placeholder="My Publisher" />
                  </>
              );
          case 'Product':
              return (
                  <>
                    <SchemaInput label="Name" value={data.name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} placeholder="Product Name" />
                    <SchemaInput label="Image URL" value={data.image || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('image', e.target.value)} placeholder="https://example.com/product.jpg" />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <textarea 
                            className="w-full h-24 p-3 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                            value={data.description || ''} 
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value)} 
                            placeholder="Product Description"
                        />
                    </div>
                    <SchemaInput label="Brand" value={data.brand || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('brand', e.target.value)} placeholder="Brand Name" />
                    <SchemaInput label="SKU" value={data.sku || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('sku', e.target.value)} placeholder="SKU12345" />
                    <div className="flex gap-4">
                        <SchemaInput label="Price" value={data.price || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('price', e.target.value)} placeholder="99.99" className="flex-1" />
                        <SchemaInput label="Currency" value={data.priceCurrency || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('priceCurrency', e.target.value)} placeholder="USD" className="flex-1" />
                    </div>
                  </>
              );
          case 'Organization':
              return (
                  <>
                    <SchemaInput label="Name" value={data.name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} placeholder="Organization Name" />
                    <SchemaInput label="URL" value={data.url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('url', e.target.value)} placeholder="https://example.com" />
                    <SchemaInput label="Logo URL" value={data.logo || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('logo', e.target.value)} placeholder="https://example.com/logo.png" />
                    <SchemaInput label="Social Profile (SameAs)" value={data.sameAs || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('sameAs', e.target.value)} placeholder="https://twitter.com/org" />
                  </>
              );
          case 'Person':
               return (
                  <>
                    <SchemaInput label="Name" value={data.name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} placeholder="John Doe" />
                    <SchemaInput label="URL" value={data.url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('url', e.target.value)} placeholder="https://johndoe.com" />
                    <SchemaInput label="Job Title" value={data.jobTitle || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('jobTitle', e.target.value)} placeholder="Software Engineer" />
                  </>
              );
           case 'Website':
               return (
                  <>
                    <SchemaInput label="Name" value={data.name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} placeholder="Site Name" />
                    <SchemaInput label="URL" value={data.url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('url', e.target.value)} placeholder="https://example.com" />
                    <SchemaInput label="Potential Action (Search URL)" value={data.searchUrl || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('searchUrl', e.target.value)} placeholder="https://example.com/search?q={search_term_string}" />
                  </>
              );
           case 'LocalBusiness':
                return (
                   <>
                     <SchemaInput label="Name" value={data.name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} placeholder="Business Name" />
                     <SchemaInput label="Image URL" value={data.image || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('image', e.target.value)} placeholder="https://example.com/store.jpg" />
                     <SchemaInput label="Address" value={data.address || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('address', e.target.value)} placeholder="123 Main St" />
                     <SchemaInput label="Telephone" value={data.telephone || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('telephone', e.target.value)} placeholder="+1-555-555-5555" />
                     <SchemaInput label="Price Range" value={data.priceRange || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('priceRange', e.target.value)} placeholder="$$" />
                   </>
               );
           case 'BreadcrumbList':
               // Simple implementation: just 3 levels
               return (
                   <>
                     <Card className="p-3 mb-2 bg-muted/20">
                         <h4 className="text-sm font-medium mb-2">Item 1 (Home)</h4>
                         <SchemaInput label="Name" value={data.item1Name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('item1Name', e.target.value)} placeholder="Home" className="mb-2" />
                         <SchemaInput label="URL" value={data.item1Url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('item1Url', e.target.value)} placeholder="https://example.com" />
                     </Card>
                     <Card className="p-3 mb-2 bg-muted/20">
                         <h4 className="text-sm font-medium mb-2">Item 2</h4>
                         <SchemaInput label="Name" value={data.item2Name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('item2Name', e.target.value)} placeholder="Category" className="mb-2" />
                         <SchemaInput label="URL" value={data.item2Url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('item2Url', e.target.value)} placeholder="https://example.com/category" />
                     </Card>
                     <Card className="p-3 bg-muted/20">
                         <h4 className="text-sm font-medium mb-2">Item 3</h4>
                         <SchemaInput label="Name" value={data.item3Name || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('item3Name', e.target.value)} placeholder="Page" className="mb-2" />
                         <SchemaInput label="URL" value={data.item3Url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('item3Url', e.target.value)} placeholder="https://example.com/category/page" />
                     </Card>
                   </>
               );
          default:
              return null;
      }
  };

  useEffect(() => {
      let jsonLd: any = {
          '@context': 'https://schema.org',
          '@type': type
      };

      if (type === 'Article') {
          jsonLd = { ...jsonLd, headline: data.headline, image: data.image ? [data.image] : undefined, author: data.author ? { '@type': 'Person', name: data.author } : undefined, datePublished: data.datePublished, publisher: data.publisher ? { '@type': 'Organization', name: data.publisher } : undefined };
      } else if (type === 'Product') {
          jsonLd = { ...jsonLd, name: data.name, image: data.image ? [data.image] : undefined, description: data.description, brand: data.brand ? { '@type': 'Brand', name: data.brand } : undefined, sku: data.sku, offers: data.price ? { '@type': 'Offer', url: '', priceCurrency: data.priceCurrency || 'USD', price: data.price } : undefined };
      } else if (type === 'Organization') {
          jsonLd = { ...jsonLd, name: data.name, url: data.url, logo: data.logo, sameAs: data.sameAs ? [data.sameAs] : undefined };
      } else if (type === 'Person') {
          jsonLd = { ...jsonLd, name: data.name, url: data.url, jobTitle: data.jobTitle };
      } else if (type === 'Website') {
          jsonLd = { ...jsonLd, name: data.name, url: data.url, potentialAction: data.searchUrl ? { '@type': 'SearchAction', target: data.searchUrl, 'query-input': 'required name=search_term_string' } : undefined };
      } else if (type === 'LocalBusiness') {
          jsonLd = { ...jsonLd, name: data.name, image: data.image, address: data.address, telephone: data.telephone, priceRange: data.priceRange };
      } else if (type === 'BreadcrumbList') {
          const items: any[] = [];
          if (data.item1Name && data.item1Url) items.push({ '@type': 'ListItem', position: 1, name: data.item1Name, item: data.item1Url });
          if (data.item2Name && data.item2Url) items.push({ '@type': 'ListItem', position: 2, name: data.item2Name, item: data.item2Url });
          if (data.item3Name && data.item3Url) items.push({ '@type': 'ListItem', position: 3, name: data.item3Name, item: data.item3Url });
          jsonLd.itemListElement = items;
      }
      
      // Filter undefined recursively or simple match
      // A simple clean function
      const clean = (obj: any): any => {
          if (Array.isArray(obj)) return obj.map(v => clean(v)).filter(v => v !== undefined && v !== null);
          if (typeof obj === 'object' && obj !== null) {
              const res: any = {};
              Object.keys(obj).forEach(key => {
                  const val = clean(obj[key]);
                  if (val !== undefined && val !== null && val !== '') res[key] = val;
              });
              return res;
          }
           return obj;
      };
      
      const cleaned = clean(jsonLd);
      setOutput(`<script type="application/ld+json">\n${JSON.stringify(cleaned, null, 2)}\n</script>`);
  }, [type, data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('JSON-LD copied to clipboard');
  };

  const handleReset = () => {
      setData({});
  };

  return (
    <ToolPane
      title="Structured Data Generator"
      description="Generate JSON-LD structured data for better SEO"
      onClear={handleReset}
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Input */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <Card className="p-4 space-y-4">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Schema Type</label>
                  <select
                    value={type}
                    onChange={(e) => { setType(e.target.value as SchemaType); setData({}); }}
                    className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    <option value="Article">Article</option>
                    <option value="Product">Product</option>
                    <option value="Organization">Organization</option>
                    <option value="Person">Person</option>
                    <option value="Website">Website</option>
                    <option value="LocalBusiness">Local Business</option>
                    <option value="BreadcrumbList">Breadcrumb</option>
                  </select>
                </div>
            </Card>

           <Card className="p-4 space-y-4">
                <h3 className="font-semibold text-lg text-foreground">{type} Details</h3>
                {renderInputs()}
           </Card>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 rounded-t-lg">
             <h3 className="text-sm font-medium text-muted-foreground">Generated JSON-LD</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
          <div className="flex-1 p-0 overflow-hidden">
             <Card className="h-full p-0 overflow-hidden bg-background border-border rounded-b-lg rounded-t-none">
               <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap overflow-auto h-full language-json">
                  {output}
               </pre>
             </Card>
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
