import { strict as assert } from "assert";
import { computeStatus, StatusContext } from "../monitoring/status";

const ctx: StatusContext = {
  yellowThreshold: 0.05, // 5%
  redThreshold: 0.1, // 10%
};

function run() {
  console.log("=".repeat(80));
  console.log("Testing computeStatus (locked vs minted)");
  console.log("=".repeat(80));

  // 1. Perfect match: locked == minted → green, 0%
  {
    const locked = 1_000_000n;
    const minted = 1_000_000n;
    const result = computeStatus(locked, minted, ctx);
    assert.equal(result.status, "green");
    assert.equal(result.deltaAbs, 0n);
    console.log("✅ Perfect match case passed");
  }

  // 2. Small discrepancy (< 5%) → green
  {
    const locked = 1_000_000n;
    const minted = 1_040_000n; // 4% higher
    const result = computeStatus(locked, minted, ctx);
    assert.equal(result.status, "green");
    console.log("✅ Small discrepancy (< yellow threshold) case passed");
  }

  // 3. Between 5% and 10% → yellow
  {
    const locked = 1_000_000n;
    const minted = 1_070_000n; // 7% higher
    const result = computeStatus(locked, minted, ctx);
    assert.equal(result.status, "yellow");
    console.log("✅ Yellow threshold case passed");
  }

  // 4. >= 10% → red
  {
    const locked = 1_000_000n;
    const minted = 1_150_000n; // 15% higher
    const result = computeStatus(locked, minted, ctx);
    assert.equal(result.status, "red");
    console.log("✅ Red threshold case passed");
  }

  // 5. Direction invariance: status uses absolute delta
  {
    const locked = 1_150_000n;
    const minted = 1_000_000n; // 15% lower
    const result = computeStatus(locked, minted, ctx);
    assert.equal(result.status, "red");
    console.log("✅ Direction invariance case passed");
  }

  console.log("\nAll computeStatus tests passed ✅");
}

run();

