<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateDbFunctions extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getLabelForId" AS
            SELECT  lbl.label,
                    con.concept_url,
                    lng.short_name
            FROM th_concept_label lbl
                JOIN th_language lng ON lbl.language_id = lng.id
                JOIN th_concept con ON con.id = lbl.concept_id
            ORDER BY lbl.concept_label_type
        ');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::getConnection()->statement('DROP VIEW public."getLabelForId"');
    }
}
