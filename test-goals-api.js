/**
 * Script để test Goals API endpoints
 * Chạy: node test-goals-api.js
 * 
 * Yêu cầu: Cần có token trong localStorage hoặc truyền vào qua biến môi trường
 */

const BASE_URL = process.env.VITE_API_BASE_URL || 
  "https://finmatecontroller20260116165929-dvckfkfvgqendpbk.eastasia-01.azurewebsites.net/api";

// Lấy token từ command line argument hoặc environment variable
const TOKEN = process.argv[2] || process.env.ACCESS_TOKEN;

if (!TOKEN) {
  console.error("❌ Vui lòng cung cấp token:");
  console.error("   node test-goals-api.js <your-token>");
  console.error("   hoặc");
  console.error("   ACCESS_TOKEN=<your-token> node test-goals-api.js");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${TOKEN}`
};

async function testEndpoint(method, url, body = null) {
  try {
    const options = {
      method,
      headers,
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log("🧪 Bắt đầu test Goals API endpoints...\n");
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // Test 1: GET /goals
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Test 1: GET /goals");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const getResult = await testEndpoint("GET", "/goals");
  if (getResult.ok) {
    console.log("✅ Status:", getResult.status);
    console.log("📦 Response:", JSON.stringify(getResult.data, null, 2));
    if (Array.isArray(getResult.data)) {
      console.log(`📊 Số lượng goals: ${getResult.data.length}`);
    }
  } else {
    console.log("❌ Status:", getResult.status);
    console.log("❌ Error:", getResult.data || getResult.error);
    if (getResult.status === 404) {
      console.log("⚠️  Endpoint chưa được implement!");
    } else if (getResult.status === 401) {
      console.log("⚠️  Token không hợp lệ hoặc đã hết hạn!");
    }
  }
  console.log("");

  // Test 2: POST /goals
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Test 2: POST /goals");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const createBody = {
    name: "Test Goal - " + new Date().toISOString(),
    targetAmount: 10000000,
    currentAmount: 2000000
  };
  console.log("📤 Request body:", JSON.stringify(createBody, null, 2));
  const createResult = await testEndpoint("POST", "/goals", createBody);
  if (createResult.ok) {
    console.log("✅ Status:", createResult.status);
    console.log("📦 Response:", JSON.stringify(createResult.data, null, 2));
    
    // Lưu goal ID để test update và delete
    const createdGoalId = createResult.data?.id;
    
    if (createdGoalId) {
      console.log(`\n💾 Đã tạo goal với ID: ${createdGoalId}`);
      
      // Test 3: PUT /goals/:id
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 Test 3: PUT /goals/:id");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      const updateBody = {
        currentAmount: 3000000
      };
      console.log("📤 Request body:", JSON.stringify(updateBody, null, 2));
      const updateResult = await testEndpoint("PUT", `/goals/${createdGoalId}`, updateBody);
      if (updateResult.ok) {
        console.log("✅ Status:", updateResult.status);
        console.log("📦 Response:", JSON.stringify(updateResult.data, null, 2));
      } else {
        console.log("❌ Status:", updateResult.status);
        console.log("❌ Error:", updateResult.data || updateResult.error);
        if (updateResult.status === 404) {
          console.log("⚠️  Endpoint chưa được implement!");
        }
      }
      
      // Test 4: DELETE /goals/:id
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 Test 4: DELETE /goals/:id");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      const deleteResult = await testEndpoint("DELETE", `/goals/${createdGoalId}`);
      if (deleteResult.ok) {
        console.log("✅ Status:", deleteResult.status);
        console.log("📦 Response:", JSON.stringify(deleteResult.data, null, 2));
      } else {
        console.log("❌ Status:", deleteResult.status);
        console.log("❌ Error:", deleteResult.data || deleteResult.error);
        if (deleteResult.status === 404) {
          console.log("⚠️  Endpoint chưa được implement!");
        }
      }
    }
  } else {
    console.log("❌ Status:", createResult.status);
    console.log("❌ Error:", createResult.data || createResult.error);
    if (createResult.status === 404) {
      console.log("⚠️  Endpoint chưa được implement!");
    } else if (createResult.status === 401) {
      console.log("⚠️  Token không hợp lệ hoặc đã hết hạn!");
    } else if (createResult.status === 400) {
      console.log("⚠️  Validation error - kiểm tra request body!");
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Tổng kết:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`GET /goals:     ${getResult.ok ? "✅" : "❌"} (${getResult.status})`);
  console.log(`POST /goals:    ${createResult.ok ? "✅" : "❌"} (${createResult.status})`);
  if (createResult.data?.id) {
    const updateResult = await testEndpoint("PUT", `/goals/${createResult.data.id}`, { currentAmount: 3000000 });
    const deleteResult = await testEndpoint("DELETE", `/goals/${createResult.data.id}`);
    console.log(`PUT /goals/:id:  ${updateResult.ok ? "✅" : "❌"} (${updateResult.status})`);
    console.log(`DELETE /goals/:id: ${deleteResult.ok ? "✅" : "❌"} (${deleteResult.status})`);
  }
}

// Chạy tests
runTests().catch(console.error);
