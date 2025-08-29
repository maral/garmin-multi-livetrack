#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("Please check your .env.local file");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log("🚀 Starting database migration...");

  try {
    // Read the SQL migration file
    const sqlPath = join(
      __dirname,
      "../database/create_shared_grids_table.sql"
    );
    const sql = readFileSync(sqlPath, "utf8");

    // Split the SQL into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(
        (s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*")
      );

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc("exec_sql", { sql: statement });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        throw error;
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log("🎉 Migration completed successfully!");

    // Verify the table was created
    console.log("🔍 Verifying table creation...");
    const { error } = await supabase
      .from("shared_grids")
      .select("count(*)")
      .limit(1);

    if (error) {
      console.error("❌ Error verifying table:", error);
    } else {
      console.log("✅ shared_grids table is ready!");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
