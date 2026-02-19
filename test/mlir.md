# MLIR Syntax Highlighting Test

## Basic Function

```mlir
module {
  func.func @hello() -> i32 {
    %c42 = arith.constant 42 : i32
    return %c42 : i32
  }
}
```

## Matrix Multiply with Affine Loops

```mlir
func.func @matmul(%A: memref<4x4xf32>, %B: memref<4x4xf32>, %C: memref<4x4xf32>) {
  // Compute C = A * B
  affine.for %i = 0 to 4 {
    affine.for %j = 0 to 4 {
      %sum_init = arith.constant 0.0 : f32
      %sum = affine.for %k = 0 to 4 iter_args(%acc = %sum_init) -> f32 {
        %a = memref.load %A[%i, %k] : memref<4x4xf32>
        %b = memref.load %B[%k, %j] : memref<4x4xf32>
        %prod = arith.mulf %a, %b : f32
        %new_acc = arith.addf %acc, %prod : f32
        affine.yield %new_acc : f32
      }
      memref.store %sum, %C[%i, %j] : memref<4x4xf32>
    }
  }
  return
}
```

## Control Flow

```mlir
func.func @control_flow(%arg0: i32) -> i32 {
  %c0 = arith.constant 0 : i32
  %c1 = arith.constant 1 : i32
  %cond = arith.cmpi sgt, %arg0, %c0 : i32

  %result = scf.if %cond -> i32 {
    %doubled = arith.muli %arg0, %c1 : i32
    scf.yield %doubled : i32
  } else {
    %negated = arith.subi %c0, %arg0 : i32
    scf.yield %negated : i32
  }

  return %result : i32
}
```

## Tensor Operations

```mlir
func.func @tensor_ops(%input: tensor<8x16xf32>) -> tensor<8x16xf32> {
  %cst = arith.constant 2.0 : f32
  %result = linalg.generic {
    indexing_maps = [
      affine_map<(d0, d1) -> (d0, d1)>,
      affine_map<(d0, d1) -> (d0, d1)>
    ],
    iterator_types = ["parallel", "parallel"]
  } ins(%input : tensor<8x16xf32>)
    outs(%input : tensor<8x16xf32>) {
    ^bb0(%in: f32, %out: f32):
      %scaled = arith.mulf %in, %cst : f32
      linalg.yield %scaled : f32
  } -> tensor<8x16xf32>
  return %result : tensor<8x16xf32>
}
```

## GPU Dialect

```mlir
func.func @gpu_kernel(%data: memref<1024xf32>) {
  %c1 = arith.constant 1 : index
  %c1024 = arith.constant 1024 : index
  %c256 = arith.constant 256 : index

  gpu.launch blocks(%bx, %by, %bz) in (%gbx = %c1, %gby = %c1, %gbz = %c1)
             threads(%tx, %ty, %tz) in (%gtx = %c256, %gty = %c1, %gtz = %c1) {
    %idx = gpu.thread_id x
    %val = memref.load %data[%idx] : memref<1024xf32>
    %two = arith.constant 2.0 : f32
    %result = arith.mulf %val, %two : f32
    memref.store %result, %data[%idx] : memref<1024xf32>
    gpu.terminator
  }
  return
}
```
