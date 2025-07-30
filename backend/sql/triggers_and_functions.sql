-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update test total marks
CREATE OR REPLACE FUNCTION update_test_total_marks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the total marks for the test based on sum of all questions
    UPDATE tests 
    SET total_marks = (
        SELECT COALESCE(SUM(marks), 0) 
        FROM questions 
        WHERE test_id = COALESCE(NEW.test_id, OLD.test_id)
    ),
    total_questions = (
        SELECT COUNT(*) 
        FROM questions 
        WHERE test_id = COALESCE(NEW.test_id, OLD.test_id)
    )
    WHERE id = COALESCE(NEW.test_id, OLD.test_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate marks for a test attempt
CREATE OR REPLACE FUNCTION calculate_attempt_marks(attempt_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    attempt_rec RECORD;
    question_rec RECORD;
    total_marks_calc DECIMAL(8,2) := 0.00;
    marks_obtained_calc DECIMAL(8,2) := 0.00;
    negative_marks_calc DECIMAL(8,2) := 0.00;
    correct_count INTEGER := 0;
    wrong_count INTEGER := 0;
    unanswered_count INTEGER := 0;
    partial_count INTEGER := 0;
    -- Status tracking counts
    skipped_count INTEGER := 0;
    answered_count INTEGER := 0;
    marked_for_review_count INTEGER := 0;
    selected_options JSONB;
    is_question_correct BOOLEAN;
    is_question_partial BOOLEAN;
    marks_for_question DECIMAL(5,2);
    question_status VARCHAR(20);
BEGIN
    -- Get attempt details
    SELECT ta.*, t.partial_credit_enabled, t.negative_marking, t.total_marks
    INTO attempt_rec
    FROM test_attempts ta
    JOIN tests t ON ta.test_id = t.id
    WHERE ta.id = attempt_id_param;
    
    IF attempt_rec IS NULL THEN
        RAISE EXCEPTION 'Test attempt not found';
    END IF;
    
    -- Clear existing question attempts
    DELETE FROM question_attempts WHERE attempt_id = attempt_id_param;
    
    -- Calculate marks for each question
    FOR question_rec IN 
        SELECT q.*, qa.selected_answers
        FROM questions q
        LEFT JOIN (
            SELECT question_id, 
                   (attempt_rec.answers->question_id::text) as selected_answers
            FROM questions 
            WHERE test_id = attempt_rec.test_id
        ) qa ON q.id = qa.question_id
        WHERE q.test_id = attempt_rec.test_id
        ORDER BY q.question_order
    LOOP
        total_marks_calc := total_marks_calc + question_rec.marks;
        selected_options := question_rec.selected_answers;
        is_question_correct := false;
        is_question_partial := false;
        marks_for_question := 0.00;
        question_status := 'skipped'; -- Default status
        
        IF selected_options IS NULL THEN
            -- Unanswered question
            unanswered_count := unanswered_count + 1;
            skipped_count := skipped_count + 1;
            question_status := 'skipped';
        ELSE
            -- Question was answered
            answered_count := answered_count + 1;
            question_status := 'answered';
            
            -- Check if answer is correct
            IF question_rec.question_type = 'single_choice' THEN
                -- Single choice: exact match required
                IF selected_options = question_rec.correct_answers->0 THEN
                    is_question_correct := true;
                    marks_for_question := question_rec.marks;
                    correct_count := correct_count + 1;
                ELSE
                    wrong_count := wrong_count + 1;
                    IF attempt_rec.negative_marking THEN
                        negative_marks_calc := negative_marks_calc + COALESCE(question_rec.negative_marks, 0);
                    END IF;
                END IF;
            ELSE
                -- Multiple choice: check for partial/full credit
                DECLARE
                    correct_selected INTEGER := 0;
                    wrong_selected INTEGER := 0;
                    total_correct INTEGER := jsonb_array_length(question_rec.correct_answers);
                    selected_array JSONB;
                    i INTEGER;
                BEGIN
                    -- Convert single selection to array format if needed
                    IF jsonb_typeof(selected_options) = 'number' THEN
                        selected_array := jsonb_build_array(selected_options);
                    ELSE
                        selected_array := selected_options;
                    END IF;
                    
                    -- Count correct and wrong selections
                    FOR i IN 0..jsonb_array_length(selected_array)-1 LOOP
                        IF question_rec.correct_answers @> jsonb_build_array(selected_array->i) THEN
                            correct_selected := correct_selected + 1;
                        ELSE
                            wrong_selected := wrong_selected + 1;
                        END IF;
                    END LOOP;
                    
                    -- Determine scoring
                    IF correct_selected = total_correct AND wrong_selected = 0 THEN
                        -- Fully correct
                        is_question_correct := true;
                        marks_for_question := question_rec.marks;
                        correct_count := correct_count + 1;
                    ELSIF correct_selected > 0 AND attempt_rec.partial_credit_enabled THEN
                        -- Partially correct
                        is_question_partial := true;
                        marks_for_question := (question_rec.marks * correct_selected / total_correct) - 
                                            (CASE WHEN wrong_selected > 0 AND attempt_rec.negative_marking 
                                             THEN question_rec.negative_marks * wrong_selected 
                                             ELSE 0 END);
                        marks_for_question := GREATEST(marks_for_question, 0); -- Don't go below 0
                        partial_count := partial_count + 1;
                    ELSE
                        -- Wrong answer
                        wrong_count := wrong_count + 1;
                        IF attempt_rec.negative_marking THEN
                            negative_marks_calc := negative_marks_calc + COALESCE(question_rec.negative_marks, 0);
                        END IF;
                    END IF;
                END;
            END IF;
        END IF;
        
        -- Insert question attempt record
        INSERT INTO question_attempts (
            attempt_id, question_id, selected_answers, 
            is_correct, is_partially_correct, marks_awarded, status
        ) VALUES (
            attempt_id_param, question_rec.id, selected_options,
            is_question_correct, is_question_partial, marks_for_question, question_status
        );
        
        marks_obtained_calc := marks_obtained_calc + marks_for_question;
    END LOOP;
    
    -- Apply negative marking
    marks_obtained_calc := marks_obtained_calc - negative_marks_calc;
    marks_obtained_calc := GREATEST(marks_obtained_calc, 0); -- Don't go below 0
    
    -- Calculate percentage
    DECLARE
        percentage_calc DECIMAL(5,2) := 0.00;
        is_passed_calc BOOLEAN := false;
        passing_marks DECIMAL(8,2);
    BEGIN
        IF total_marks_calc > 0 THEN
            percentage_calc := (marks_obtained_calc * 100.0) / total_marks_calc;
            
            -- Get passing percentage from test
            SELECT (total_marks * passing_percentage / 100.0) INTO passing_marks
            FROM tests WHERE id = attempt_rec.test_id;
            
            is_passed_calc := marks_obtained_calc >= passing_marks;
        END IF;
        
        -- Update test attempt with calculated values including status counts
        UPDATE test_attempts SET
            total_marks = total_marks_calc,
            marks_obtained = marks_obtained_calc,
            percentage_score = percentage_calc,
            negative_marks_deducted = negative_marks_calc,
            correct_answers = correct_count,
            wrong_answers = wrong_count,
            unanswered_questions = unanswered_count,
            partial_credit_answers = partial_count,
            skipped_questions = skipped_count,
            answered_questions = answered_count,
            marked_for_review_questions = marked_for_review_count,
            is_passed = is_passed_calc,
            completed_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
        WHERE id = attempt_id_param;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to check if student is eligible for a test
CREATE OR REPLACE FUNCTION is_student_eligible_for_test(student_id_param INTEGER, test_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    student_rec RECORD;
    test_rec RECORD;
BEGIN
    SELECT s.class_level, s.board_id, s.medium_id, s.school_id
    INTO student_rec
    FROM students s
    WHERE s.id = student_id_param;
    
    SELECT target_classes, target_boards, target_mediums, target_schools
    INTO test_rec
    FROM tests t
    WHERE t.id = test_id_param AND t.is_active = true;
    
    IF student_rec IS NULL OR test_rec IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check eligibility criteria
    IF NOT test_rec.target_classes @> to_jsonb(student_rec.class_level) THEN
        RETURN false;
    END IF;
    
    IF test_rec.target_boards IS NOT NULL AND 
       NOT test_rec.target_boards @> to_jsonb(student_rec.board_id) THEN
        RETURN false;
    END IF;
    
    IF test_rec.target_mediums IS NOT NULL AND 
       NOT test_rec.target_mediums @> to_jsonb(student_rec.medium_id) THEN
        RETURN false;
    END IF;
    
    IF test_rec.target_schools IS NOT NULL AND 
       NOT test_rec.target_schools @> to_jsonb(student_rec.school_id) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tests_updated_at
    BEFORE UPDATE ON tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger to auto-update test total marks when questions are added/updated/deleted
CREATE TRIGGER questions_update_test_marks
    AFTER INSERT OR UPDATE OR DELETE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_test_total_marks();