import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// CSV Google Sheet Link من .env
const SHEET_URL = process.env.SHEET_URL;

// Helper function لتنظيف البيانات
function cleanCsvData(data) {
  return data.replace(/"/g, '').replace(/\r/g, '').trim();
}

// Parse CSV manually مع معالجة أفضل
function parseCsv(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => cleanCsvData(h));
  const tours = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= headers.length) {
      const tour = {};
      headers.forEach((header, index) => {
        tour[header] = values[index] ? cleanCsvData(values[index]) : '';
      });
      
      // تأكد إن البيانات المهمة موجودة
      if (tour.Name && tour.Name !== '') {
        tours.push(tour);
      }
    }
  }
  
  return tours;
}

// GET /api/tours - جلب كل الجولات
router.get("/", async (req, res) => {
  try {
    console.log("🔄 جاري جلب البيانات من:", SHEET_URL);
    
    if (!SHEET_URL) {
      return res.status(500).json({ 
        error: "❌ SHEET_URL غير موجود في .env",
        tours: []
      });
    }

    const response = await fetch(SHEET_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    console.log("✅ تم جلب البيانات بنجاح، الطول:", csvData.length);
    
    const tours = parseCsv(csvData);
    console.log("📊 عدد الجولات المُعالجة:", tours.length);

    res.json({ 
      success: true,
      count: tours.length,
      tours: tours
    });

  } catch (err) {
    console.error("❌ خطأ في جلب الجولات:", err.message);
    res.status(500).json({ 
      error: "❌ فشل في جلب البيانات من Google Sheet",
      details: err.message,
      tours: []
    });
  }
});

// GET /api/tours/:id - جلب جولة محددة
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(SHEET_URL);
    const csvData = await response.text();
    const tours = parseCsv(csvData);
    
    const tour = tours.find((t, index) => index.toString() === id || t.ID === id);
    
    if (!tour) {
      return res.status(404).json({ error: "❌ الجولة غير موجودة" });
    }
    
    res.json({ tour });
    
  } catch (err) {
    console.error("❌ خطأ في جلب الجولة:", err.message);
    res.status(500).json({ error: "❌ فشل في جلب الجولة" });
  }
});

export default router;
