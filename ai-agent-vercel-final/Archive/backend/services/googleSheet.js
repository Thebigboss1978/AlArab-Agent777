import fetch from "node-fetch";

class GoogleSheetService {
  constructor() {
    this.sheetUrl = process.env.SHEET_URL;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  // تنظيف وتحليل البيانات بشكل متقدم
  cleanAndParseData(data) {
    return data
      .replace(/"/g, '') // إزالة علامات الاقتباس
      .replace(/\r/g, '') // إزالة carriage return
      .replace(/\u200B/g, '') // إزالة zero-width space
      .trim();
  }

  // تحليل CSV مع معالجة أخطاء متقدمة
  parseCsvData(csvText) {
    try {
      const lines = csvText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length < 2) {
        throw new Error('CSV data is too short - needs headers and at least one data row');
      }

      // استخراج الهيدر
      const headers = lines[0]
        .split(',')
        .map(h => this.cleanAndParseData(h))
        .filter(h => h.length > 0);

      console.log('📋 Headers found:', headers);

      const tours = [];

      // معالجة كل سطر
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue;

        // تقسيم القيم مع معالجة الفواصل داخل النصوص
        const values = this.smartSplit(line);
        
        if (values.length < headers.length) {
          console.warn(`⚠️ Row ${i} has fewer columns than headers:`, values);
          continue;
        }

        const tour = {};
        headers.forEach((header, index) => {
          const value = values[index] ? this.cleanAndParseData(values[index]) : '';
          tour[header] = value;
        });

        // تحقق من وجود البيانات المهمة
        if (tour.Name && tour.Name.length > 0) {
          // إضافة metadata
          tour._id = i.toString();
          tour._lastUpdated = new Date().toISOString();
          
          // تنسيق رقم الواتساب
          if (tour.Phone) {
            tour.WhatsAppLink = this.generateWhatsAppLink(tour.Phone, tour.Name);
          }
          
          tours.push(tour);
        }
      }

      return tours;

    } catch (error) {
      console.error('❌ Error parsing CSV:', error.message);
      throw new Error(`Failed to parse CSV data: ${error.message}`);
    }
  }

  // تقسيم ذكي للقيم مع معالجة الفواصل
  smartSplit(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current); // Add the last value
    return values;
  }

  // توليد رابط واتساب
  generateWhatsAppLink(phone, tourName) {
    // تنظيف رقم الهاتف
    const cleanPhone = phone.replace(/\D/g, '');
    
    // إضافة كود مصر إذا لم يكن موجود
    const fullPhone = cleanPhone.startsWith('20') ? cleanPhone : `20${cleanPhone}`;
    
    // رسالة افتراضية
    const message = encodeURIComponent(`مرحباً! أريد الاستفسار عن جولة: ${tourName}`);
    
    return `https://wa.me/${fullPhone}?text=${message}`;
  }

  // جلب البيانات مع cache
  async fetchToursData() {
    const cacheKey = 'tours_data';
    const cached = this.cache.get(cacheKey);
    
    // تحقق من الكاش
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      console.log('✅ Using cached data');
      return cached.data;
    }

    try {
      if (!this.sheetUrl) {
        throw new Error('SHEET_URL is not configured in environment variables');
      }

      console.log('🔄 Fetching fresh data from:', this.sheetUrl);
      
      const response = await fetch(this.sheetUrl, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'User-Agent': 'Alarab-Tours-Bot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvData = await response.text();
      
      if (!csvData || csvData.length < 50) {
        throw new Error('Received empty or too short CSV data');
      }

      console.log(`✅ Fetched ${csvData.length} characters of CSV data`);

      const tours = this.parseCsvData(csvData);
      
      // حفظ في الكاش
      this.cache.set(cacheKey, {
        data: tours,
        timestamp: Date.now()
      });

      console.log(`📊 Processed ${tours.length} tours successfully`);
      
      return tours;

    } catch (error) {
      console.error('❌ Error fetching tours data:', error.message);
      
      // إعادة البيانات المحفوظة في الكاش حتى لو انتهت صلاحيتها
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('⚠️ Using expired cache due to fetch error');
        return cached.data;
      }
      
      throw error;
    }
  }

  // البحث في الجولات
  async searchTours(query) {
    const tours = await this.fetchToursData();
    
    if (!query || query.trim() === '') {
      return tours;
    }

    const searchTerm = query.toLowerCase();
    
    return tours.filter(tour => {
      return Object.values(tour).some(value => 
        typeof value === 'string' && 
        value.toLowerCase().includes(searchTerm)
      );
    });
  }

  // الحصول على جولة واحدة
  async getTourById(id) {
    const tours = await this.fetchToursData();
    return tours.find(tour => tour._id === id || tour.ID === id);
  }

  // إحصائيات الجولات
  async getToursStats() {
    const tours = await this.fetchToursData();
    
    return {
      total_tours: tours.length,
      last_updated: new Date().toISOString(),
      cache_status: this.cache.has('tours_data') ? 'active' : 'empty',
      cache_age: this.cache.has('tours_data') 
        ? Date.now() - this.cache.get('tours_data').timestamp 
        : 0
    };
  }

  // مسح الكاش
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }
}

// إنشاء instance واحد للاستخدام العام
const googleSheetService = new GoogleSheetService();

export default googleSheetService;
