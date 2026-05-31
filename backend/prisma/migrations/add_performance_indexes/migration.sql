-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "labs_departmentId_idx" ON "labs"("departmentId");

-- CreateIndex
CREATE INDEX "labs_createdAt_idx" ON "labs"("createdAt");

-- CreateIndex
CREATE INDEX "items_labId_idx" ON "items"("labId");

-- CreateIndex
CREATE INDEX "items_category_idx" ON "items"("category");

-- CreateIndex
CREATE INDEX "items_condition_idx" ON "items"("condition");

-- CreateIndex
CREATE INDEX "items_createdAt_idx" ON "items"("createdAt");

-- CreateIndex
CREATE INDEX "schedules_labId_idx" ON "schedules"("labId");

-- CreateIndex
CREATE INDEX "schedules_date_idx" ON "schedules"("date");

-- CreateIndex
CREATE INDEX "schedules_createdBy_idx" ON "schedules"("createdBy");

-- CreateIndex
CREATE INDEX "schedules_createdAt_idx" ON "schedules"("createdAt");

-- CreateIndex
CREATE INDEX "attendances_userId_idx" ON "attendances"("userId");

-- CreateIndex
CREATE INDEX "attendances_labId_idx" ON "attendances"("labId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_createdAt_idx" ON "attendances"("createdAt");

-- CreateIndex
CREATE INDEX "loans_userId_idx" ON "loans"("userId");

-- CreateIndex
CREATE INDEX "loans_itemId_idx" ON "loans"("itemId");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loans_approvedBy_idx" ON "loans"("approvedBy");

-- CreateIndex
CREATE INDEX "loans_dueDate_idx" ON "loans"("dueDate");

-- CreateIndex
CREATE INDEX "loans_createdAt_idx" ON "loans"("createdAt");
